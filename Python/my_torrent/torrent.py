import bencode
import hashlib

class Torrent:
    def __init__(self, arquivo_torrent):
        with open(arquivo_torrent, 'rb') as f:
            metadados = bencode.bdecode(f.read())

        self.anunciar = metadados['announce']
        self.info = metadados['info']
        self.nome = self.info['name']
        self.tamanho_peca = self.info['piece length']
        self.pecas = self._gerar_pecas()

    def _gerar_pecas(self):
        hashes = self.info['pieces']
        pecas = []
        i = 0
        while i < len(hashes):
            pecas.append(hashes[i:i+20])
            i += 20
        return pecas

    def verificar_peca(self, indice_peca, peca):
        hash_esperado = self.pecas[indice_peca]
        hash_calculado = hashlib.sha1(peca).digest()
        return hash_esperado == hash_calculado