const net = require("net");
const helpers = require("./helpers");
const actions = require("./actions");
const strings = require("./strings");
const messageReceiveMenager = require("./messageReceiveMenager");

module.exports = class Peer {
  constructor(host, port) {
    this.dfsNeighbors = {
      initial: "",
      validNeighbors: [],
      activeNeighbor: "",
      started : false
    };
    this.host = host;
    this.port = port;
    this.neighbors = [];
    this.waitingResponses = [];
    this.sockets = {};
    this.localTable = {};
    this.ttl = 100;
    this.sqn = {
      HELLO: 0,
      SEARCH: 0,
      VAL: 0,
      BYE: 0,
    };
    this.searchesReceived = {
      RW: 0,
      FL: 0,
      BP: 0,
    };
    this.hopCount = {
      RW: [],
      FL: [],
      BP: [],
    };
    this.openedMessagesSet = new Set();
    this.server = net.createServer((socket) => {
      socket.on("data", (data) => {
        console.log(`Mensagem recebida "${data.toString()}"`);
        messageReceiveMenager(data, this, socket);
      });
    });

    this.server.listen(port, host, () => {
      console.log(`Servidor criado ${host}:${port}\n`);
    });
  }

  socketHeader = (operation) => {
    return `${this.host}:${this.port} ${this.sqn[operation]}`;
  };

  connectTo(host, port) {
    this.incrementMsgSqn("HELLO");
    return new Promise((resolve, reject) => {
      console.log(`Tentando adicionar vizinho ${host}:${port}`);
      let header = this.socketHeader("HELLO");
      console.log(
        `Encaminhando mensagem "${header} 1 HELLO" para ${host}:${port}`
      );
      const client = net.createConnection({ host, port }, () => {
        client.write(`${header} 1 HELLO`);
        client.once("data", (data) => {
          const formattedData = data.toString().split(" ");

          if (formattedData[3] == "HELLO") {
            helpers.sendConfirmationMessage(data, client);
          }
          if (formattedData[3] === "HELLO_OK") {
            if (!this.checkIfIncludesNeighbor(`${host}:${port}`)) {
              this.addNeighbor(`${host}:${port}`);
              this.sockets[`${host}:${port}`] = client;
            }
            console.log(
              `   Envio feito com sucesso:"${this.host}:${this.port} ${this.sqn["HELLO"]} 1 HELLO"`
            );
          }
          resolve();
        });
      });

      client.on("end", () => {
        console.log(`Desconectado do servidor ${host}:${port}`);
        this.neighbors = this.neighbors.filter(
          (neighbor) => neighbor !== `${host}:${port}`
        );
        delete this.sockets[`${host}:${port}`];
      });
      client.on("error", (err) => {
        reject(err);
      });
    });
  }

  updateTtl = (newValue) => {
    this.ttl = newValue;
  };

  incrementMessageQuantity = (operation) => {
    this.searchesReceived[operation] += 1;
  };

  getMessagesReceived = (operation) => {
    return this.searchesReceived[operation];
  };

  getAvgHops = (operation) => {
    const hops = this.hopCount[operation];
    if (hops.length === 0) {
      return 0;
    }
    return hops.reduce((a, b) => a + b, 0) / hops.length;
  };

  getDeviation(operation) {
    const arr = this.hopCount[operation];
    if (arr.length === 0) {
      return 0;
    }
    const media = this.getAvgHops(operation);
    const variancia =
      arr.reduce((soma, valor) => soma + Math.pow(valor - media, 2), 0) /
      (arr.length - 1);
    return Math.sqrt(variancia);
  }

  getServer = () => {
    return this.server;
  };

  addNeighbor = (neighbor) => {
    this.neighbors.push(neighbor);
  };

  addSocket = (socket, address) => {
    this.sockets[address] = socket;
  };

  deleteSocket = (address) => {
    delete this.sockets[address];
  };

  removeNeighbor = (neighbor) => {
    this.neighbors = this.neighbors.filter((n) => n !== neighbor);
  };

  getNeighbors = () => {
    return this.neighbors;
  };

  getSockets = () => {
    return this.sockets;
  };

  incrementMsgSqn = (operation) => {
    this.sqn[operation] += 1;
  };

  checkIfIncludesNeighbor = (neighbor) => {
    return this.neighbors.includes(neighbor);
  };

  setLocalTableKeys = (key, value) => {
    this.localTable[key] = value;
  };

  getLocalTable = () => {
    return this.localTable;
  };

  getTtl = () => {
    return this.ttl;
  };

  getOpenendMessagesSet = () => {
    return this.openedMessagesSet;
  };

  addOpenedMessage = (message) => {
    this.openedMessagesSet.add(message);
  };

  getPort = () => {
    return this.port;
  };

  getHost = () => {
    return this.host;
  };

  addHopCount = (operation, hopCount) => {
    this.hopCount[operation].push(hopCount);
  };

  getMsgSqn = (operation) => {
    return this.sqn[operation];
  };

  getRandomWalkNeighbors = () => {
    return this.randomWalkNeighbors;
  }

  addRandomWalkNeighbor = (neighbor) => {
    this.randomWalkNeighbors.push(neighbor);
  }

 cleanRandomWalkNeighbors = () => {
    this.dfsNeighbors.initial = "";
    this.dfsNeighbors.validNeighbors = [];
    this.dfsNeighbors.activeNeighbor = "";
 }

 updateDfsNeighborsByType = (type, neighbor) => {
    this.dfsNeighbors[type] = neighbor;
  }
 

  updateDfsNeighbors = (initial, validNeighbors , activeNeighbor) => {
    this.dfsNeighbors.initial = initial;
    this.dfsNeighbors.validNeighbors = validNeighbors;
    this.dfsNeighbors.activeNeighbor = activeNeighbor;
    this.dfsNeighbors.started = true;

  }
};
