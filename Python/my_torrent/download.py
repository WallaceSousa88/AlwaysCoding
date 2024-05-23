class Download:
    def __init__(self, torrent):
        self.torrent = torrent
        self.peers = []

    def iniciar(self):
        self._obter_peers()
        # ... (Lógica para conectar a peers, baixar pedaços, etc.) ...

    def _obter_peers(self):
        tracker = Tracker(self.torrent)
        self.peers = tracker.obter_peers()

    # ... (Outras funções para gerenciar o download) ...