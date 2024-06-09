sendConfirmationMessage = (message, socket) => {
  return new Promise((resolve) => {
  message = message.toString().split(" ");
  message[3] += "_OK";
  message = message.join(" ");
  socket.write(message);
  resolve();
})
};

const createMessage = (peer, ttl, operation, parameters) => {
  let message = `${peer.socketHeader(operation)} ${ttl} ${operation}`;
  if (parameters) {
    parameters.forEach((parameter) => {
      message += ` ${parameter}`;
    });
  }
  return message;
};

const checkTtl = (message) => {
  return message - 1 > 0 ? true : false;
};

const formatToResend = (message, port) => {
  message = message.toString().split(" ");
  message[2] = `${Number(message[2]) - 1}`;
  message[7] = `${Number(message[7]) + 1}`;
  message[5] = port;
  message = message.join(" ");
  return message;
};



module.exports = {
  sendConfirmationMessage,
  createMessage,
  formatToResend,
  checkTtl,
};
