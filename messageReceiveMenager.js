const helpers = require("./helpers");
const net = require("net");

messageSender = (socket, message, operation) => {
  return new Promise(async (resolve, reject) => {
    socket.write(message);

    await socket.once("data", (data) => {
      const formattedData = data.toString().split(" ");
      if (formattedData[3] === operation + "_OK") {
        console.log(`   Envio feito com sucesso:"${message}"`);
        resolve();
      } else {
        console.log("erro");
      }
    });
  });
};

tryToSendMessage = async (socket, mensage, operation) => {
  try {
    await messageSender(socket, mensage, operation);
  } catch {
    console.log("Erro ao enviar mensagem");
  }
};

messageReceiveMenager = async (data, peer, socket) => {
  const messsage = data.toString().split(" ");
  switch (messsage[3]) {
    case "HELLO":
      helpers.sendConfirmationMessage(data, socket);

      if (peer.checkIfIncludesNeighbor(messsage[0])) {
        console.log(`   Vizinho ja esta na tabela: ${messsage[0]}`);
      } else {
        console.log(`   Adicionando vizinho ${messsage[0]}`);
        client = net.createConnection({
          host: messsage[0].split(":")[0],
          port: messsage[0].split(":")[1],
        });
        peer.addNeighbor(`${messsage[0]}`);
        peer.addSocket(client, messsage[0]);
      }
      break;
    case "VAL":
      helpers.sendConfirmationMessage(data, socket);

      console.log(`   Valor encontrado!`);
      console.log(`     Chave: ${messsage[6]} Valor: ${messsage[7]}`);
      break;
    case "SEARCH":
      let messageIdentifier = `${messsage[0]}${messsage[1]}`;
      if (messsage[4] == "FL") {
        if (peer.getOpenendMessagesSet().has(messageIdentifier)) {
          helpers.sendConfirmationMessage(data, socket);
          console.log(`   Flooding mensagem repetida`);

          return;
        } else if (messsage[6] in peer.getLocalTable()) {
          console.log(`   Chave encontrada!`);
          peer.addOpenedMessage(messageIdentifier);
          let value = peer.getLocalTable()[messsage[6]];
          let message = helpers.createMessage(peer, messsage[2], "VAL", [
            "FL",
            messsage[6],
            value,
            messsage[7],
          ]);
          console.log(
            `Encaminhando mensagem: "${message}" para ${messsage[0]}`
          );
          if (message[0] in peer.getNeighbors()) {
            originSocket = peer.getSockets()[messsage[0]];
            await tryToSendMessage(originSocket, message, "VAL").then(() =>
              helpers.sendConfirmationMessage(data, socket)
            )
          }else{
            client = net.createConnection({host: messsage[0].split(":")[0], port: messsage[0].split(":")[1]});
            await tryToSendMessage(client, message, "VAL").then(() =>
              helpers.sendConfirmationMessage(data, socket)
            )
          }
          return;
        } else if (!helpers.checkTtl(messsage[2])) {
          console.log(`   Ttl igual a zero, descartando mensagem`);
          helpers.sendConfirmationMessage(data, socket);
          peer.addOpenedMessage(messageIdentifier);
          return;
        } else {
          helpers.sendConfirmationMessage(data, socket);

          peer.addOpenedMessage(messageIdentifier);
          let message = helpers.formatToResend(data, peer.port);

          for (let neighbor of peer.getNeighbors()) {
            if (
              neighbor.split(":")[1] != messsage[5] &&
              neighbor != messsage[0]
            ) {
              console.log(
                `Encaminhando mensagem "${message}" para ${neighbor}`
              );
              await tryToSendMessage(
                peer.getSockets()[neighbor],
                message,
                "SEARCH"
              );
            }
          }
          return;
        }
      }
      if(messsage[4] == "RW"){
       if (messsage[6] in peer.getLocalTable()) {
          console.log(`   Chave encontrada!`);
          let value = peer.getLocalTable()[messsage[6]];
          let message = helpers.createMessage(peer, messsage[2], "VAL", [
            "RW",
            messsage[6],
            value,
            messsage[7],
          ]);
          console.log(
            `Encaminhando mensagem: "${message}" para ${messsage[0]}`
          );
          if (message[0] in peer.getNeighbors()) {
            originSocket = peer.getSockets()[messsage[0]];
            await tryToSendMessage(originSocket, message, "VAL").then(() =>
              helpers.sendConfirmationMessage(data, socket)
            )
          }else{
            client = net.createConnection({host: messsage[0].split(":")[0], port: messsage[0].split(":")[1]});
            await tryToSendMessage(client, message, "VAL").then(() =>
              helpers.sendConfirmationMessage(data, socket)
            )
          }
          return;
        } 
         if (!helpers.checkTtl(messsage[2])) {
          console.log(`   Ttl igual a zero, descartando mensagem`);
          helpers.sendConfirmationMessage(data, socket);
          return;
        } 
        let message = helpers.formatToResend(data, peer.port);
        if(peer.getNeighbors() == 1){
          peer.getSockets()[peer.getNeighbors()[0]].write(message);
        }else{
          otherNeighbor = peer.getNeighbors().filter(neighbor => neighbor.split(":")[1] != messsage[5]);
        }
      }
      break;
    case "BYE":
      helpers.sendConfirmationMessage(data, socket);
      console.log(`   Removendo vizinho na tabela ${messsage[0]}`);
      peer.removeNeighbor(messsage[0]);
      peer.deleteSocket(messsage[0]);
      socket.end();
  }
};

module.exports = messageReceiveMenager;
