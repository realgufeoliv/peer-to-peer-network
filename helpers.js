sendConfirmationMessage = (message,socket) => {
    message = message.toString().split(' ');
    message[3] += '_OK';
    message = message.join(' ');
    socket.write(message);
}

const createMessage = (peer, ttl, operation , parameters) =>{
    let message = `${peer.socketHeader()} ${ttl} ${operation}`
    if(parameters.length > 0){
      parameters.forEach((parameter) => {
        message += ` ${parameter}`
      })
    }
    return message
  }

const checkTtl = (message) => {
   return (message - 1) > 0 ? true : false; 
}  

const formatToResend = (message,port) => {
  message = message.toString().split(' ');
  message[1] = message[1] - 1;
  message[7] = message[7] + 1;
  message[5] = port
  message = message.join(' ');
  return message;
}


module.exports = { sendConfirmationMessage , createMessage, formatToResend, checkTtl}