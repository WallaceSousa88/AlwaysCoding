from collections import OrderedDict
from .bencoding import Decoder

class Torrent:
    def __init__(self, torrent_file):
        with open(torrent_file, 'rb') as f:
            self.meta_info = f.read()
        self.torrent = Decoder(self.meta_info).decode()

    @property
    def announce(self):
        return self.torrent.get(b'announce').decode()

    @property
    def announce_list(self):
        return [url.decode() for sublist in self.torrent.get(b'announce-list', []) for url in sublist]

    @property
    def comment(self):
        return self.torrent.get(b'comment').decode()

    @property
    def creation_date(self):
        return self.torrent.get(b'creation date')

    @property
    def info(self):
        return self.torrent.get(b'info')
