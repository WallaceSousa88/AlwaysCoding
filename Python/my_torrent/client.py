from .bencoding import Decoder

class BitTorrentClient:
    def __init__(self, torrent_file):
        with open(torrent_file, 'rb') as f:
            self.meta_info = f.read()

    def start(self):
        torrent = Decoder(self.meta_info).decode()
