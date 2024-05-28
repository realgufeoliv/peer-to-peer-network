const Peer = require("./Peer");
const fs = require("fs");

const arguments = process.argv.slice(2);
const address = arguments[0].split(":");
const host = address[0];
const port = address[1];
const peer = new Peer(host, port);

fs.readFile(arguments[1], 'utf8', async (err, data) => {
    if (err) {
        console.error('Erro ao ler o arquivo:', err);
        return;
    }

    let neighbors = data.split("\n").filter(line => line.trim() !== '');

    for (const line of neighbors) {
        const [neighborHost, neighborPort] = line.split(":");
        try {
            await peer.connectTo(neighborHost, neighborPort);
        } catch (err) {
            console.error(`   Erro ao conectar!`);
        }
    }
    console.log(`\n\nEscolha o comando 	
          [0] Listar vizinhos
          [1] HELLO
          [2] SEARCH (flooding)
          [3] SEARCH (random walk)
          [4] SEARCH (busca em profundidade)
          [5] Estatisticas
          [6] Alterar valor padrao de TTL
          [9] Sair`);
});
