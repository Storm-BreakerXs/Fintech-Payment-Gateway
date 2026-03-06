import { PaymentMethod, Session, Transaction, User } from './database'
import { logger } from './logger'

export async function purgeDueAccountDeletions(): Promise<number> {
  const dueUsers = await User.find({
    accountDeletionScheduledFor: { $ne: null, $lte: new Date() },
  }).select('_id email')

  if (dueUsers.length === 0) {
    return 0
  }

  const userIds = dueUsers.map((user) => user._id)

  await Promise.all([
    Transaction.deleteMany({ userId: { $in: userIds } }),
    PaymentMethod.deleteMany({ userId: { $in: userIds } }),
    Session.deleteMany({ userId: { $in: userIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ])

  dueUsers.forEach((user) => {
    logger.warn(`Permanently deleted scheduled account: ${user.email}`)
  })

  return dueUsers.length
}
