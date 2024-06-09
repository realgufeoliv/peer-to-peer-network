const actions = require("./actions");
const readline = require("readline");
const strings = require("./strings");
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.prompt();
const helpers = require("./helpers");
promptUser = (peer, prompt) => {
  rl.question(prompt, (answer) => {
    if (answer == "") {
      console.log("Comando invalido");
      promptUser(prompt);
    } else {
      userOption(peer, answer);
    }
  });
};

messageSender = (socket, message, operation, address) => {
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

tryToSendMessage = async (socket, mensage, operation, address) => {
  try {
    await messageSender(socket, mensage, operation, address);
  } catch {
    console.log("Erro ao enviar mensagem");
  }
};

chooseNeighbor = async (peer) => {
  let answer = await genericPrompt("");
  if (checkIfIsInRange(0, peer.getNeighbors().length, answer)) {
    peer.incrementMsgSqn("HELLO");
    console.log(
      `Encaminhando mensagem "${peer.socketHeader("HELLO")} 1 HELLO" para ${
        peer.getNeighbors()[answer]
      }`
    );
    await tryToSendMessage(
      peer.getSockets()[peer.getNeighbors()[answer]],
      `${peer.socketHeader("HELLO")} 1 HELLO`,
      "HELLO",
      peer.getNeighbors()[answer]
    );
    promptUser(peer, strings.menu);
  } else {
    console.log("Vizinho invalido, digite novamente:");
    chooseNeighbor(peer);
  }
};

genericPrompt = (prompt) => {
  return new Promise((resolve, reject) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

checkIfIsInRange = (min, max, value) => {
  return value >= min && value <= max;
};

floodingSearch = async (peer) => {
  let answer = await genericPrompt("Digite a chave a ser buscada:\n");
  if (answer in peer.getLocalTable()) {
    console.log(`Valor na tabela local!`);
    console.log(`   chave:${answer}  valor: ${peer.getLocalTable()[answer]}`);
    return;
  } else {
    peer.incrementMsgSqn("SEARCH");

    let messageIdentifier = `${peer.getHost()}:${peer.getPort()}${peer.getMsgSqn(
      "SEARCH"
    )}`;
    peer.addOpenedMessage(messageIdentifier);

    let floodMessage = helpers.createMessage(peer, peer.getTtl(), "SEARCH", [
      "FL",
      peer.getPort(),
      answer,
      "1",
    ]);

    for (let neighbor of peer.getNeighbors()) {
      console.log(`Encaminhando mensagem "${floodMessage}" para ${neighbor}`);
      await tryToSendMessage(
        peer.getSockets()[neighbor],
        floodMessage,
        "SEARCH",
        neighbor
      );
    }
  }
};

randomWalkSearch = async (peer) => {
  let answer = await genericPrompt("Digite a chave a ser buscada:\n");
  if (answer in peer.getLocalTable()) {
    console.log(`Valor na tabela local!`);
    console.log(`   chave:${answer}  valor: ${peer.getLocalTable()[answer]}`);
    return;
  } else {
    peer.incrementMsgSqn("SEARCH");

    let randomWalkMessage = helpers.createMessage(
      peer,
      peer.getTtl(),
      "SEARCH",
      ["RW", peer.getPort(), answer, "1"]
    );

    let randomNeighbor =
      peer.getNeighbors()[
        Math.floor(Math.random() * peer.getNeighbors().length)
      ];

    console.log(
      `Encaminhando mensagem "${randomWalkMessage}" para ${randomNeighbor}`
    );
    await tryToSendMessage(
      peer.getSockets()[randomNeighbor],
      randomWalkMessage,
      "SEARCH",
      randomNeighbor
    );
  }
};

function isNumeric(value) {
  return !isNaN(value) && !isNaN(parseFloat(value));
}

changeTtl = async (peer) => {
  let answer = await genericPrompt("Digite o novo valor de TTL:\n");
  if (isNumeric(answer)) {
    peer.updateTtl(answer);
  } else {
    console.log("Valor invalido");
    changeTtl(peer);
  }
};

getStatistics = (peer) => {
  console.log("\nEstatisticas:");
  console.log(
    `Total de mensagens de flooding vistas: ${peer.getMessagesReceived("FL")}`
  );
  console.log(
    `Total de mensagens de random walk vistas: ${peer.getMessagesReceived(
      "RW"
    )}`
  );
  console.log(
    `Total de mensagens de busca em profundidade vistas: ${peer.getMessagesReceived(
      "BP"
    )}`
  );
  console.log(
    `Media de saltos ate encontrar destino por flooding: ${peer.getAvgHops(
      "FL"
    )} (dp ${peer.getDeviation("FL")})`
  );
  console.log(
    `Media de saltos ate encontrar destino por random walk: ${peer.getAvgHops(
      "RW"
    )} (dp ${peer.getDeviation("RW")})`
  );
  console.log(
    `Media de saltos ate encontrar destino por busca em profundidade: ${peer.getAvgHops(
      "BP"
    )} (dp ${peer.getDeviation("BP")})`
  );
};

dfsSearch = async (peer) => {
  let answer = await genericPrompt("Digite a chave a ser buscada:\n");
  if (answer in peer.getLocalTable()) {
    console.log(`Valor na tabela local!`);
    console.log(`   chave:${answer}  valor: ${peer.getLocalTable()[answer]}`);
    return;
  } else {
    peer.incrementMsgSqn("SEARCH");

    let dfsMessage = helpers.createMessage(peer, peer.getTtl(), "SEARCH", [
      "BP",
      peer.getPort(),
      answer,
      "1",
    ]);

    let randomNeighbor =
      peer.getNeighbors()[
        Math.floor(Math.random() * peer.getNeighbors().length)
      ];
    let updatedNeighbors = peer
      .getNeighbors()
      .filter((neighbor) => neighbor !== randomNeighbor);
    let activeNeighbor = randomNeighbor;

    peer.updateDfsNeighbors(
      `${peer.getPort()}`,
      updatedNeighbors,
      activeNeighbor
    );

    console.log(`Encaminhando mensagem "${dfsMessage}" para ${randomNeighbor}`);
    await tryToSendMessage(
      peer.getSockets()[randomNeighbor],
      dfsMessage,
      "SEARCH", 
    );
  }
};

byeMessage = async (peer) => {
  let byeMessage = helpers.createMessage(peer, 1, "BYE");
  for (let neighbor of peer.getNeighbors()) {
    peer.incrementMsgSqn("BYE");
    console.log(`Encaminhando mensagem "${byeMessage}" para ${neighbor}`);
    await tryToSendMessage(
      peer.getSockets()[neighbor],
      byeMessage,
      "BYE",
      neighbor
    );
    peer.getSockets()[neighbor].destroy();
  }
};

const userOption = async (peer, answer) => {
  if (!["0", "1", "2", "3", "4", "5", "6", "9"].includes(answer)) {
    console.log("Comando invalido");
    promptUser(peer, strings.menu);
  } else {
    switch (answer) {
      case "0":
        actions.getNeighbors(peer.getNeighbors());
        promptUser(peer, strings.menu);
        break;
      case "1":
        console.log("\nEscolha o Vizinho");
        actions.getNeighbors(peer.getNeighbors());
        chooseNeighbor(peer);
        break;
      case "2":
        await floodingSearch(peer);
        promptUser(peer, strings.menu);
        break;
      case "3":
        await randomWalkSearch(peer).then(() => promptUser(peer, strings.menu));

        break;
      case "4":
        await dfsSearch(peer);
        promptUser(peer, strings.menu);
        break;
      case "5":
        getStatistics(peer);

        promptUser(peer, strings.menu);
        break;
      case "6":
        await changeTtl(peer);
        promptUser(peer, strings.menu);
        break;
      case "9":
        console.log("Saindo...");
        await byeMessage(peer);
        peer.getServer().close();
        process.exit(0);
        break;
    }
  }
};

module.exports = { userOption, promptUser };
