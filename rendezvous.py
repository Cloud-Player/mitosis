import json
import redis
import random
import traceback
import signal
import sys

import tornado.options as opt
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.log import app_log
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler


class RendezvousHandler(WebSocketHandler):

    ROUTER = {}
    MY_ADDRESS = 'mitosis/v1/p007/ws/localhost:8040/websocket'

    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)
        self.peer_id = '0'
        self.redis = redis_session()
        self.pubsub = self.redis.pubsub(ignore_subscribe_messages=True)
        self.pubsub.subscribe(keep_alive=lambda: True)
        self.callback = PeriodicCallback(self.pubsub.get_message, 100, 0.1)
        self.callback.start()

    def open(self):
        app_log.info('ws open')

    def on_message(self, message):
        message = json.loads(message)
        app_log.error(message)
        subject = message.get('subject')
        if subject == 'peer-update':
            self.on_peer_update(message)
        elif subject == 'connection-negotiation':
            self.on_connection_negotiation(message)

    def on_peer_update(self, message):
        sender = message['sender']
        self.peer_id = sender.split('/', 3)[2]
        self.pubsub.subscribe(**{'peer-%s' % self.peer_id: self.forward})
        if RendezvousHandler.ROUTER:
            app_log.warning('%s (peer) joined', self.peer_id)
            self.send_message(sender, 'role-update', ['peer'])
            self.send_message(sender, 'peer-update', [RendezvousHandler.ROUTER])
        else:
            app_log.warning('%s (router) joined', self.peer_id)
            roles = ['router', 'peer']
            RendezvousHandler.ROUTER.update(
                {'peerId': self.peer_id, 'roles': roles, 'quality': 1.0})
            self.send_message(sender, 'role-update', roles)

    def on_connection_negotiation(self, message):
        receiver = message['receiver']
        receiver_id = receiver.split('/', 3)[2]
        self.redis.publish('peer-%s' % receiver_id, self.dumps(message))

    def send_message(self, receiver, subject, body):
        message = {
            'subject': subject,
            'sender': self.MY_ADDRESS,
            'receiver': receiver,
            'body': body}
        self.write_message(self.dumps(message))

    def forward(self, message):
        self.write_message(message['data'])

    def dumps(self, data):
        return json.dumps(data, separators=',:', sort_keys=True)

    def on_close(self):
        if self.peer_id == RendezvousHandler.ROUTER.get('peerId'):
            RendezvousHandler.ROUTER.clear()
            app_log.warning('%s (router) left', self.peer_id)
        else:
            app_log.warning('%s left', self.peer_id)
        self.callback.stop()
        self.pubsub.close()

    def check_origin(self, origin):
        return True


class FallbackHandler(RequestHandler):

    def get(self, *args):
        self.set_status(200)


def define_options():
    opt.define('port', type=int, default=8040)
    opt.define('debug', type=bool, default=True, group='app')
    opt.parse_command_line()
    opt.define('websocket_ping_interval', type=int, default=1, group='app')
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
        [(r'/websocket', RendezvousHandler),
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
