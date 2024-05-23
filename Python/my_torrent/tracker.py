import requests
import bencode

class Tracker:
    def __init__(self, torrent):
        self.torrent = torrent
        self.peer_id = '-PC0001-' + '1234567890'  # Substitua por um ID único

    def obter_peers(self):
        params = {
            'info_hash':  self.torrent.info['pieces'][:20],  
            'peer_id':   self.peer_id,
            'port':      6881, 
            'uploaded':  0,
            'downloaded':0,
            'left':      self.torrent.tamanho_total,
            'compact':   1
        }
        response = requests.get(self.torrent.anunciar, params=params)
        if response.status_code == 200:
            dados_tracker = bencode.bdecode(response.content)
            return self._processar_resposta(dados_tracker)
        else:
            raise Exception('Erro ao conectar ao tracker.')

    def _processar_resposta(self, dados_tracker):
        peers = []
        if 'peers' in dados_tracker:
            if isinstance(dados_tracker['peers'], list):
                # Lista de dicionários
                for peer in dados_tracker['peers']:
                    peers.append((peer['ip'], peer['port']))
            elif isinstance(dados_tracker['peers'], bytes):
                # String compacta de peers
                peers_compacta = dados_tracker['peers']
                i = 0
                while i < len(peers_compacta):
                    ip = ".".join(str(b) for b in peers_compacta[i:i+4])
                    porta = int.from_bytes(peers_compacta[i+4:i+6], byteorder='big')
                    peers.append((ip, porta))
                    i += 6
        return peers