from torrent import Torrent
from download import Download

if __name__ == '__main__':
    arquivo_torrent = input("Digite o caminho para o arquivo .torrent: ")
    torrent = Torrent(arquivo_torrent)

    download = Download(torrent)
    download.iniciar()