

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

    const totalVotes = poll.options.reduce(
      (sum, o) => sum + o._count.votes,
      0
    );

    res.json({
      ...poll,
      totalVotes,
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

    const totalVotes = poll.options.reduce(
      (sum, o) => sum + o._count.votes,
      0
    );

    res.json({
      ...poll,
      totalVotes,
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

    await prisma.vote.create({
      data: { userId, pollId, optionId },
    });

    await broadcastPollResults(pollId);

    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
        },
        creator: true,
      },
    });

    if (!updatedPoll) return res.status(404).json({ error: "poll not found" });

    const totalVotes = updatedPoll.options.reduce(
      (sum, o) => sum + o._count.votes,
      0
    );

    res.json({
      ...updatedPoll,
      totalVotes,
      options: updatedPoll.options.map((o) => ({
        id: o.id,
        text: o.text,
        votes: o._count.votes,
      })),
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "already voted" });
    }
    res.status(500).json({ error: err.message });
  }
}

export async function getAllPolls(req, res, prisma) {
  try {
    const polls = await prisma.poll.findMany({
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
        },
        creator: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedPolls = polls.map((poll) => {
      const totalVotes = poll.options.reduce(
        (sum, o) => sum + o._count.votes,
        0
      );
      return {
        ...poll,
        totalVotes,
        options: poll.options.map((o) => ({
          id: o.id,
          text: o.text,
          votes: o._count.votes,
        })),
      };
    });

    res.json(formattedPolls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
