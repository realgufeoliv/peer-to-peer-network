const actions = require('./actions');
const readline = require("readline"); 
const strings = require('./strings')
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  }); 
rl.prompt();
const helpers = require('./helpers');
promptUser = (peer,prompt) => {
    
      rl.question(prompt, (answer) => {
        if(answer == ''){
          console.log('Comando invalido')
          promptUser(prompt)
         
        }else{
          userOption(peer,answer);
        }
        
   
      });


  }

  messageSender = (socket, message, operation,address) => {
    
    return new Promise(async(resolve, reject) => {
    socket.write(message);
    
   await socket.once('data', (data) => {
      const formattedData = data.toString().split(' ');
      if (formattedData[3] === operation + '_OK') {
        console.log(`   Envio feito com sucesso:"${message} para ${address}"`);
        resolve();
      }else{
        console.log('erro')

      }
    });
  });
  }

  tryToSendMessage = async (socket, mensage , operation, address ) => {
    try{
        await messageSender(socket, mensage , operation, address)
    }catch{
        console.log('Erro ao enviar mensagem')
    }
  }

  chooseNeighbor = async (peer) => {
            let answer = await genericPrompt('')
            if(checkIfIsInRange(0,peer.getNeighbors().length,answer)){
              peer.incrementMsgCount();
                console.log(`Encaminhando mensagem "${peer.socketHeader()} 1 HELLO" para ${peer.getNeighbors()[answer]}`);
                await tryToSendMessage(peer.getSockets()[peer.getNeighbors()[answer]], `${peer.socketHeader()} 1 HELLO` , 'HELLO',peer.getNeighbors()[answer])
                promptUser(peer,strings.menu)
            }else{
                console.log('Vizinho invalido, digite novamente:')
                chooseNeighbor(peer)
            }
      
  }

  genericPrompt = (prompt) => {
    return new Promise((resolve, reject) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  checkIfIsInRange = (min,max, value) => {
    return value >= min && value <= max
  }

  

  floodingSearch = async (peer) => {
    let answer = await genericPrompt('Digite a chave a ser buscada:\n')
    if(answer in peer.getLocalTable()){
      console.log(`Valor na tabela local!`)
      console.log(`   chave:${answer}  valor: ${peer.getLocalTable()[answer]}`)
      return;
    }else{
      peer.incrementMsgCount();
      let floodMessage = helpers.createMessage(peer,peer.getTtl(), 'SEARCH', ['FL',  peer.getPort(), answer, peer.getHopCount()])
      
      for (let neighbor of peer.getNeighbors()) {
        console.log(`Encaminhando mensagem "${floodMessage}" para ${neighbor}`);
        await tryToSendMessage(peer.getSockets()[neighbor], floodMessage, 'SEARCH', neighbor);
    }
      
     

    }
  }



const  userOption = async (peer, answer) => {
    if(!['0','1','2','3','4','5','6','7','8','9'].includes(answer)){
        console.log('Comando invalido')
        promptUser(peer,strings.menu);
    }else{
    switch (answer) {
        case '0':
            actions.getNeighbors(peer.getNeighbors());
            promptUser(peer,strings.menu);
        break
        case '1':
            console.log('\nEscolha o Vizinho')
            actions.getNeighbors(peer.getNeighbors());
            chooseNeighbor(peer);
        break
        case '2':
          await floodingSearch(peer);
          
          break;
           
    }
  }
}

module.exports = {userOption,promptUser};