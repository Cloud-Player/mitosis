abstract class Router extends Peer {

    peers: Peer[];
    upstream: Peer;
    succession: Peer[];

    abstract advertise();
    abstract introduce(offer: Offer);
}

module.exports = Router;
