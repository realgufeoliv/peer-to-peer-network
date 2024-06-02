menu = `\nEscolha o comando 	
        [0] Listar vizinhos
        [1] HELLO
        [2] SEARCH (flooding)
        [3] SEARCH (random walk)
        [4] SEARCH (busca em profundidade)
        [5] Estatisticas
        [6] Alterar valor padrao de TTL
        [9] Sair\n`

printTryingToAddNeighbor = (address) => {
    console.log(`Tentando adicionar vizinho ${address}`);
}

module.exports = {menu,printTryingToAddNeighbor};