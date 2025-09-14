// src/controllers/pollController.js

export async function createPoll(req, res, prisma) {
  const { question, creatorId, options, isPublished } = req.body;
  if (!question || !creatorId || !options?.length) {
    return res.status(400).json({ error: "invalid" });
  }

  try {
    const poll = await prisma.poll.create({
      data: {
        question,
        isPublished: !!isPublished,
        creatorId: Number(creatorId),
        options: { create: options.map((text) => ({ text })) },
      },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
        },
        creator: true,
      },
    });

    // Format clean response
    res.json({
      ...poll,
      options: poll.options.map((o) => ({
        id: o.id,
        text: o.text,
        votes: o._count.votes,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPoll(req, res, prisma) {
  const id = Number(req.params.id);

  try {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
        },
        creator: true,
      },
    });

    if (!poll) return res.status(404).json({ error: "not found" });

    res.json({
      ...poll,
      options: poll.options.map((o) => ({
        id: o.id,
        text: o.text,
        votes: o._count.votes,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function votePoll(req, res, prisma, broadcastPollResults) {
  const pollId = Number(req.params.pollId);
  const { userId, optionId } = req.body;

  try {
    const option = await prisma.pollOption.findUnique({
      where: { id: optionId },
    });
    if (!option || option.pollId !== pollId) {
      return res.status(400).json({ error: "invalid option" });
    }

    const vote = await prisma.vote.create({
      data: { userId, pollId, optionId },
    });

    await broadcastPollResults(pollId); // <- fixed: no need to pass prisma anymore
    res.json(vote);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "already voted" });
    }
    res.status(500).json({ error: err.message });
  }
}
