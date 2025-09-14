
import { hash } from "bcrypt";

export async function createUser(req, res, prisma) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "missing fields" });
  }

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const { passwordHash: _, ...safe } = user;
  res.json(safe);
}
