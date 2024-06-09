const Peer = require("./Peer");
const fs = require("fs");
const strings = require("./strings");
const userInterface = require("./userInterface");
// Importa o módulo readline, auxilia na leitura e envio de dados pelo terminal
// Cria uma interface de leitura e escrita
const arguments = process.argv.slice(2);
const address = arguments[0].split(":");
const host = address[0];
const port = address[1];
const peer = new Peer(host, port);

fs.readFile(arguments[1], "utf8", async (err, data) => {
  if (err) {
    console.error("Erro ao ler o arquivo:", err);
    return;
  }

  let neighbors = data.split("\n").filter((line) => line.trim() !== "");

  for (const line of neighbors) {
    const [neighborHost, neighborPort] = line.split(":");
    try {
      await peer.connectTo(neighborHost, neighborPort);
    } catch (err) {
      console.error(`   Erro ao conectar!`);
    }
  }
  console.log("\n")
  let setingLocalTable = fs.readFileSync(arguments[2], "utf8");
  let atb = setingLocalTable.split("\n").filter((line) => line.trim() !== "");
  atb.forEach((line) => {
    const [key, value] = line.split(" ");
    console.log(`Adicionando par (${key}, ${value}) na tabela local`)
    peer.setLocalTableKeys(key, value);
  })


  userInterface.promptUser(peer, strings.menu);
});
