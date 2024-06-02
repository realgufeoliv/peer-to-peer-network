const net = require('net');
const helpers = require('./helpers');
const actions = require('./actions');
const strings = require('./strings')
const messageReceiveMenager = require('./messageReceiveMenager')

module.exports = class Peer {
  constructor(host, port) {
    this.hop_count = 1;
    this.host = host;
    this.port = port;
    this.neighbors = [];
    this.msg_count = 0;
    this.waitingResponses = [];
    this.sockets = {};
    this.localTable = {};
    this.ttl = 100;
    this.openedMessagesSet = new Set();
    this.server = net.createServer((socket) => {
      socket.on('data', (data) => {
        helpers.sendConfirmationMessage(data, socket);

        console.log(`Mensagem recebida "${data.toString()}"`)
        messageReceiveMenager(data, this, socket);
      });
    });
    this.server.listen(port, host, () => {
      console.log(`Servidor criado ${host}:${port}\n`);
    });
  }

  socketHeader = () => {
    return `${this.host}:${this.port} ${this.msg_count}`;
  }

  connectTo(host, port) {
    this.msg_count += 1;
    return new Promise((resolve, reject) => {
      console.log(`Tentando adicionar vizinho ${host}:${port}`);
      console.log(`Encaminhando mensagem "${this.socketHeader()} 1 HELLO" para ${host}:${port}`);
      const client = net.createConnection({ host, port }, () => {
        client.write(`${this.socketHeader()} 1 HELLO`);
        client.on('data', data => {
          const formattedData = data.toString().split(' ');
  
          if(formattedData[3] == 'HELLO'){
            helpers.sendConfirmationMessage(data, client);
          }
          if(formattedData[3] === 'HELLO_OK'){
            if(!this.checkIfIncludesNeighbor(`${host}:${port}`)){
              this.addNeighbor(`${host}:${port}`);
              this.sockets[`${host}:${port}`] = client;
              
  
            }
            console.log(`   Envio feito com sucesso:"${this.host}:${this.port} ${this.msg_count} 1 HELLO"`);
  
          }
          resolve();
        });
      });

      client.on('end', () => {
        console.log(`Desconectado do servidor ${host}:${port}`);
        this.neighbors = this.neighbors.filter(neighbor => neighbor !== `${host}:${port}`);
        delete this.sockets[`${host}:${port}`];
      });
      client.on('error', err => {
        reject(err);
      });
    });
  }

  addNeighbor = (neighbor) => {
    this.neighbors.push(neighbor);
  }

  addSocket = (socket,address) => {
    this.sockets[address] = socket;
  }

  getNeighbors = () => {
      return this.neighbors;
   }

   getSockets = () => {
      return this.sockets;
   }

   incrementMsgCount = () => {
      this.msg_count += 1;
   }

  checkIfIncludesNeighbor = (neighbor) => {
    return this.neighbors.includes(neighbor);
  }

  setLocalTableKeys = (key, value) => {
    this.localTable[key] = value;
  }

  getLocalTable = () => {
    return this.localTable;
  }

  getTtl = () => {
    return this.ttl;
  }


  getOpenendMessagesSet = () => {
    return this.openedMessagesSet;
  }

  addOpenedMessage = (message) => {
    this.openedMessagesSet.add(message);
  }

  getHopCount = () => {
    return this.hop_count;
  }

  getPort = () => {
    return this.port;
  }
};
