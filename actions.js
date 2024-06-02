

getNeighbors = (neighbors) => {
    console.log(`Há ${neighbors.length} Vizinhos na tabela:`);
    neighbors.forEach((neighbor, index) => {
        console.log(`     [${index}] ${neighbor}`);
    });
}

module.exports = {getNeighbors};