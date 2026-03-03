const hre = require('hardhat')

async function main() {
  const [deployer] = await hre.ethers.getSigners()

  console.log('Deploying contracts with account:', deployer.address)
  console.log('Account balance:', (await deployer.provider.getBalance(deployer.address)).toString())

  // Deploy PaymentProcessor
  const PaymentProcessor = await hre.ethers.getContractFactory('PaymentProcessor')
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address
  const paymentProcessor = await PaymentProcessor.deploy(feeRecipient)

  await paymentProcessor.waitForDeployment()

  console.log('PaymentProcessor deployed to:', await paymentProcessor.getAddress())

  // Deploy Escrow
  const PaymentEscrow = await hre.ethers.getContractFactory('PaymentEscrow')
  const escrow = await PaymentEscrow.deploy()

  await escrow.waitForDeployment()

  console.log('PaymentEscrow deployed to:', await escrow.getAddress())

  // Verify on Etherscan if not on localhost
  if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
    console.log('Waiting for block confirmations...')
    await paymentProcessor.deploymentTransaction().wait(5)

    await hre.run('verify:verify', {
      address: await paymentProcessor.getAddress(),
      constructorArguments: [feeRecipient]
    })

    await hre.run('verify:verify', {
      address: await escrow.getAddress(),
      constructorArguments: []
    })
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })