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

HandleHello = (data, socket, peer, messsage) => {
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
};

messageReceiveMenager = async (data, peer, socket) => {
  const messsage = data.toString().split(" ");
  switch (messsage[3]) {
    case "HELLO":
      HandleHello(data, socket, peer, messsage);
      break;
    case "VAL":
      helpers.sendConfirmationMessage(data, socket);

      peer.addHopCount(messsage[4], Number(messsage[7]));
      console.log(`   Valor encontrado!`);
      console.log(`     Chave: ${messsage[5]} Valor: ${messsage[6]}`);
      break;
    case "SEARCH":
      let messageIdentifier = `${messsage[0]}${messsage[1]}`;
      peer.incrementMessageQuantity(messsage[4]);
      if (messsage[4] == "FL") {
        if (peer.getOpenendMessagesSet().has(messageIdentifier)) {
          helpers.sendConfirmationMessage(data, socket);
          console.log(`   Flooding mensagem repetida`);

          return;
        } else if (messsage[6] in peer.getLocalTable()) {
          console.log(`   Chave encontrada!`);
          peer.addOpenedMessage(messageIdentifier);
          let value = peer.getLocalTable()[messsage[6]];
          peer.incrementMsgSqn("VAL");
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
            );
          } else {
            client = net.createConnection({
              host: messsage[0].split(":")[0],
              port: messsage[0].split(":")[1],
            });
            await tryToSendMessage(client, message, "VAL").then(() =>
              helpers.sendConfirmationMessage(data, socket)
            );
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
      if (messsage[4] == "RW") {
        if (messsage[6] in peer.getLocalTable()) {
          peer.addOpenedMessage(messageIdentifier);
          console.log(`   Chave encontrada!`);
          let value = peer.getLocalTable()[messsage[6]];
          peer.incrementMsgSqn("VAL");
          let message = helpers.createMessage(peer, peer.getTtl(), "VAL", [
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
            );
          } else {
            client = net.createConnection({
              host: messsage[0].split(":")[0],
              port: messsage[0].split(":")[1],
            });
            await tryToSendMessage(client, message, "VAL").then(() =>
              helpers.sendConfirmationMessage(data, socket)
            );
          }
          return;
        } else if (!helpers.checkTtl(messsage[2])) {
          console.log(`   Ttl igual a zero, descartando mensagem`);
          helpers.sendConfirmationMessage(data, socket);

          return;
        } else {
          let message = helpers.formatToResend(data, peer.port);
          peer.addOpenedMessage(messageIdentifier);

          otherNeighbor = peer
            .getNeighbors()
            .filter((neighbor) => neighbor.split(":")[1] != messsage[5]);
          randomNeighbor =
            otherNeighbor[Math.floor(Math.random() * otherNeighbor.length)];
          console.log(
            `Encaminhando mensagem: "${message}" para ${randomNeighbor}`
          );
          helpers.sendConfirmationMessage(data, socket);
          await tryToSendMessage(
            peer.getSockets()[randomNeighbor],
            message,
            "SEARCH"
          );
        }
      }
      if (messsage[4] == "BP") {
        if (messsage[6] in peer.getLocalTable()) {
          peer.addOpenedMessage(messageIdentifier);
          console.log(`   Chave encontrada!`);
          let value = peer.getLocalTable()[messsage[6]];
          peer.incrementMsgSqn("VAL");
          let message = helpers.createMessage(peer, peer.getTtl(), "VAL", [
            "BP",
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
            );
          } else {
            client = net.createConnection({
              host: messsage[0].split(":")[0],
              port: messsage[0].split(":")[1],
            });
            await tryToSendMessage(client, message, "VAL").then(() =>
              helpers.sendConfirmationMessage(data, socket)
            );
          }
          return;
        } else if (!helpers.checkTtl(messsage[2])) {
          console.log(`   Ttl igual a zero, descartando mensagem`);
          helpers.sendConfirmationMessage(data, socket);

          return;
        } else {
          peer.addOpenedMessage(messageIdentifier);
          if (!peer.dfsNeighbors.started) {
            peer.updateDfsNeighbors(messsage[5], peer.getNeighbors(), "");
          }

          let lastNeightborRemoved = peer.dfsNeighbors.validNeighbors.filter(
            (neighbor) => neighbor.split(":")[1] != messsage[5]
          );

          peer.updateDfsNeighborsByType("validNeighbors", lastNeightborRemoved);

          if (
            peer.dfsNeighbors.initial == peer.getPort() &&
            peer.dfsNeighbors.activeNeighbor == messsage[5] &&
            peer.dfsNeighbors.validNeighbors.length == 0
          ) {
            console.log(
              `BP: Não foi possível localizar a chave ${messsage[6]}`
            );
            helpers.sendConfirmationMessage(data, socket);

            return;
          } else if (
            peer.dfsNeighbors.activeNeighbor != messsage[5] &&
            messsage[5] != messsage[0].split(":")[1] &&
            peer.dfsNeighbors.activeNeighbor != ""
          ) {
            console.log("BP: ciclo detectado, devolvendo a mensagem...");
            let message = helpers.formatToResend(data, peer.port);
            peer.updateDfsNeighborsByType("activeNeighbor", messsage[5]);
            console.log(
              `Encaminhando mensagem: "${message}" para ${peer.dfsNeighbors.activeNeighbor}`
            );
            const activeNeighborFullAddress = peer
              .getNeighbors()
              .find((item) => item.includes(peer.dfsNeighbors.activeNeighbor));
              helpers.sendConfirmationMessage(data, socket);

            await tryToSendMessage(
              peer.getSockets()[activeNeighborFullAddress],
              message,
              "SEARCH"
            );
            return;
          } else if (peer.dfsNeighbors.validNeighbors.length == 0) {
            console.log(
              "BP: nenhum vizinho encontrou a chave, retrocedendo..."
            );
            
            let returnMessage = helpers.formatToResend(data, peer.port);
            const initialNeighborFullAddress = peer
              .getNeighbors()
              .find((item) => item.includes(peer.dfsNeighbors.initial));

            console.log(
              `Encaminhando mensagem: "${returnMessage}" para ${initialNeighborFullAddress}`
            );
            helpers.sendConfirmationMessage(data, socket);

            await tryToSendMessage(
              peer.getSockets()[initialNeighborFullAddress],
              returnMessage,
              "SEARCH"
            );
            return;
          } else {
            let message = helpers.formatToResend(data, peer.port);
            randomNeighbor =
              peer.dfsNeighbors.validNeighbors[
                Math.floor(
                  Math.random() * peer.dfsNeighbors.validNeighbors.length
                )
              ];

            let updatedNeighbors = peer.dfsNeighbors.validNeighbors.filter(
              (neighbor) => neighbor != randomNeighbor
            );
            peer.updateDfsNeighbors(
              peer.dfsNeighbors.initial,
              updatedNeighbors,
              randomNeighbor
            );
            console.log(
              `Encaminhando mensagem: "${message}" para ${randomNeighbor}`
            );
            helpers.sendConfirmationMessage(data, socket);

            await tryToSendMessage(
              peer.getSockets()[randomNeighbor],
              message,
              "SEARCH"
            );
          }
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
