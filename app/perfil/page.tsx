import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import ProfileClient from "./ProfileClient"

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect("/login")

  return (
    <ProfileClient
      username={user.username}
      changes={user.usernameChanges}
      image={user.image}
      name={user.name}
      email={user.email}
      createdAt={user.createdAt.toISOString()}
      balance={user.balance}
    />
  )
}
