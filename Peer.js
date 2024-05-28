const { Console } = require('console');
const net = require('net');

module.exports = class Peer {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.neighbors = [];
    this.msg_count = 0;
    this.server = net.createServer((socket) => {
      socket.on('data', (data) => {
        //data recebida
        const formattedData = data.toString().split(' ');
        console.log(formattedData)
        if(formattedData[3] === 'HELLO_OK'){
          console.log(`   Vizinho adicionado com sucesso!`);
        }



       
          console.log(`Mensagem recebida: ${data.toString()}`);
        switch(formattedData[3]){
          case 'HELLO':
            console.log(`   Adicionando vizinho ${formattedData[0]}`);
            this.neighbors.push({host: formattedData[0], port: formattedData[1]});
            socket.write(`${this.host}:${this.port} ${formattedData[2]} 1 HELLO_OK`)
            break;            
        
      }
      });
    });
    this.server.listen(port, host, () => {
      console.log(`Servidor criado ${host}:${port}\n`);
    });
  }

  connectTo(host, port) {
    this.msg_count += 1;
    return new Promise((resolve, reject) => {
      console.log(`Tentando adicionar vizinho ${host}:${port}`);
      console.log(`Encaminhando mensagem "${this.host}:${this.port} ${this.msg_count} 1 HELLO" para ${host}:${port}`);

      const client = net.createConnection({ host, port }, () => {
        client.write(`${this.host}:${this.port} ${this.msg_count} 1 HELLO`);        
        
      });
      client.on('data', data => {
        const formattedData = data.toString().split(' ');
        if(formattedData[3] === 'HELLO_OK'){
          console.log(`   Envio feito com sucesso:"${this.host}:${this.port} ${this.msg_count} 1 HELLO"`);
        }
        resolve();
      });
      client.on('end', () => {
        console.log(`Desconectado do servidor ${host}:${port}`);
      });
      client.on('error', err => {
        reject(err);
      });
    });
  }

};
