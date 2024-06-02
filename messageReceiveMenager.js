const helpers = require('./helpers');
const net = require('net');

messageReceiveMenager = (data, peer, socket) =>{
    const messsage = data.toString().split(' ');
    switch(messsage[3]){
        case 'HELLO':
            if(peer.checkIfIncludesNeighbor(messsage[0])){
                console.log(`   Vizinho ja esta na tabela: ${messsage[0]}`);
              }else{
              console.log(`   Adicionando vizinho ${messsage[0]}`);
                client = net.createConnection({host: messsage[0].split(':')[0], port: messsage[0].split(':')[1]})
              peer.addNeighbor(`${messsage[0]}`);
              peer.addSocket(client,messsage[0]);
            }
        break;
        case 'VAL':
            console.log(`   Valor encontrado!`)
            console.log(`   Chave: ${messsage[6]} Valor: ${messsage[7]}`)
            break;
        case 'SEARCH':
            let messageIdentifier = `${messsage[1]}${messsage[5]}`
            if(messsage[4] == 'FL'){
                if(peer.getOpenendMessagesSet().has(messageIdentifier)){
                    console.log(`   Flooding mensagem repetida`);
                   
                } else
                if(messsage[6] in peer.getLocalTable()){
                    console.log(`   Chave encontrada`)
                    let value = peer.getLocalTable()[messsage[6]];
                    let message = helpers.createMessage(peer,messsage[2], 'VAL', ['FL', messsage[6],value, peer.getHopCount()])
                    socket.write(message)
                }
                else
                    if(!helpers.checkTtl(messsage[2])){
                        console.log(`   Ttl igual a zero, descartando mensagem`)
                    }else{
                        peer.addOpenedMessage(messageIdentifier);
                        let message  = helpers.formatToResend(data, peer.port);
                        
                        peer.getNeighbors().forEach((neighbor) => {
                            if(neighbor.split(':')[1] != messsage[5]){
                                console.log(`   Encaminhando mensagem "${message}" para ${neighbor}`);
                                socket.write(message)
                                
                            }
                        })
                    }
            }        
        break;   
    }

}

module.exports = messageReceiveMenager;