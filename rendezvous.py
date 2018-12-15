import json
import redis
import random
import signal
import sys

import tornado.options as opt
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.log import app_log
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler


ROUTER = None


class RendezvousHandler(WebSocketHandler):

    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.redis = redis_session()

    def open(self):
        app_log.info('ws open')

    def on_message(self, message):
        message = json.loads(message)
        if 'offers' in message:
            self.on_offers(message)
        elif 'answer' in message:
            self.on_answer(message)
        elif

    def on_offers(self, message):
        self.initiator = message['initiator']
        self.redis.sadd('peers', self.initiator)
        app_log.info('%s joined', self.initiator)
        self.pubsub = self.redis.pubsub(ignore_subscribe_messages=True)
        self.pubsub.subscribe(**{'peer-%s' % self.initiator: self.forward})
        self.callback = PeriodicCallback(self.pubsub.get_message, 100, 0.1)
        self.callback.start()
        offers = message['offers']
        random.shuffle(offers)
        peers = [int(p.decode('utf-8')) for p in
                 self.redis.srandmember('peers', len(offers) + 1)
                 if int(p.decode('utf-8')) != self.initiator]
        for peer, offer in zip(peers, offers):
            offer['initiator'] = self.initiator
            offer['responder'] = peer
            self.redis.publish('peer-%s' % peer, self.dumps(offer))
            app_log.info('send offer %s from %s to %s',
                         offer['id'], self.initiator, peer)

    def on_answer(self, message):
        app_log.info('%s answered %s from %s', message['responder'],
                     message['id'], message['initiator'])
        self.redis.publish(
            'peer-%s' % message['initiator'], self.dumps(message))

    def forward(self, message):
        self.write_message(message['data'])

    def dumps(self, data):
        return json.dumps(data, separators=',:', sort_keys=True)

    def on_close(self):
        try:
            self.callback.stop()
            self.redis.srem('peers', self.initiator)
            self.pubsub.unsubscribe('peer-%s' % self.initiator)
            self.pubsub.close()
            app_log.info('%s left', self.initiator)
        except AttributeError:
            app_log.info('premature exit')

    def check_origin(self, origin):
        return True


class FallbackHandler(RequestHandler):

    def get(self, *args):
        self.set_status(200)


def define_options():
    opt.define('port', type=int, default=8040)
    opt.define('debug', type=bool, default=True, group='app')
    opt.parse_command_line()
    opt.define('websocket_ping_interval', type=int, default=10, group='app')
    opt.define('websocket_ping_timeout', type=int, default=10, group='app')
    opt.define('redis_host', type=str, default='127.0.0.1', group='redis')
    opt.define('redis_port', type=int, default=6379, group='redis')
    opt.define('redis_db', type=int, default=0, group='redis')


def redis_session():
    return redis.Redis(
        **{k.replace('redis_', ''): v for k, v in
           opt.options.group_dict('redis').items()})


def main():
    define_options()
    redis_session().delete('peers')
    app = Application(
        [(r'/', HomeHandler),
         (r'/websocket', RendezvousHandler),
         (r'.*', FallbackHandler)],
        **opt.options.group_dict('app'))
    app.listen(opt.options.port)
    app_log.info('server listening at 127.0.0.1:%s', opt.options.port)
    ioloop = IOLoop.current()

    def shutdown(*args):
        redis_session().delete('peers')
        app_log.info('server shutting down')
        ioloop.stop()
        app_log.info('exit')
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown)

    try:
        ioloop.start()
    except KeyboardInterrupt:
        shutdown()


if __name__ == '__main__':
    main()
