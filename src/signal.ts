abstract class Signal extends Peer {

    abstract introduce(offer: Offer): Answer;
}

module.exports = Signal;
