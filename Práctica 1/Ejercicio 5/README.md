# Voting

El contrato [voting.sol](./voting.sol) subido en la [web de ejemplos de solidity](https://docs.soliditylang.org/en/v0.8.27/solidity-by-example.html#voting) cuenta con la propuesta de mejoras:

_Actualmente se necesitan muchas transacciones para asignar los derechos de voto a todos los participantes. Además, si dos o más propuestas tienen el mismo número de votos, `winningProposal()` no puede registrar un empate.  ¿Puede pensar en una manera de solucionar estos problemas?_

El documento [improvement.sol](./improvement.sol) contiene dicha mejora.

## Mejoras en el contrato de votación

Este contrato de votación implementa dos mejoras principales con respecto a la versión original:

### 1. Asignación de derechos de voto en lotes

En la versión original del contrato, se requería realizar múltiples transacciones para asignar los derechos de voto a cada participante individualmente. Esto no es eficiente cuando hay un número significativo de votantes.

Se ha agregado la función `giveRightToVoteBatch`, que permite asignar los derechos de voto a múltiples direcciones en una sola transacción. Esto reduce el número de transacciones necesarias y mejora el rendimiento cuando se otorgan derechos de voto a un grupo grande de votantes.

### 2. Empate en la propuesta ganadora

El contrato original no contemplaba la posibilidad de que dos o más propuestas tuvieran la misma cantidad de votos, ya que solo devolvía la primera propuesta con el mayor número de votos. Esto no es ideal en situaciones de empate.

Se ha agregado la función `winningProposals`, que devuelve un arreglo con todas las propuestas que tienen la mayor cantidad de votos, permitiendo identificar todos los empates. También se ha añadido la función `winnerNames`, que devuelve los nombres de las propuestas ganadoras (incluyendo los empates).
