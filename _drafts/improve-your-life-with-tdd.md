Improve your life with TDD

As employees or freelancers we sell our time and work to companies and customers. But one thing that distinguishes our profession is the fact that we sell intellectual work (even high level intellectual work).

So, taking care of the wellness of our mind and intelligence is a reasonable activity we should often practice.

Many people in the development world think or even say that testing is hard and that it hurts, not to mention Test Driven Development (TDD).

But I want to demonstrate that TDD is the way to follow if you want to have a healthier life as developer.

But first, let me tell you a couple of things about how our brain works. Is there anyone in the room that doesn’t know how to use a door?
Sure? Have you ever seen a door with an instruction manual? I have.  (pull/push)

Have you ever stood in front of a door without knowing how to open it? I have.

In fact, there are lots of them out there.

The point is that a door should be easy to use. But this not always 
happens. How to use a door is something that should be obvious, isn’t it? 
What about switches? I’m talking about those switch panels in large rooms that don’t correlate with the locations of the lights they control. They are sometimes located where lights are out of sight. You need to try several times to find the secret combinations to turn on the light you want. The relation between a switch and the bulb that it controls should be obvious.

When we talk about obvious, we talk about knowledge that we don’t need to access in our heads. The knowledge is there, in the world. We only need to use it while doing other things. We want to open doors and switch lights without having to think about.

So, when we have to think about things that should be obvious, we are wasting part of our mental resources, allocating space in our working memory that we’d rather use for another purposes.

Knowledge is in the world when all clues we need to use an object are present in the object itself. So, we don’t need to care, reason or retrieve how to operate that thing. When we need to do that (to reason, to remember instructions, etc), we need to put the knowledge in our heads in order to 
achieve our goals.

So, with more knowledge in the world when we perform a task, we need less knowledge in our head, leaving free room we can use, for example, to think better about the task at hand.

The less I have to think in the tools, the more I can think in the task I’m performing with those tools.

But, how much room is available?

Well… it sounds disappointing: not too much.

We have a practically infinite storage capacity in our memory. Think of it as a really huge and intelligent hard disk, that keeps memories and data for years. It is not a passive storage. In fact, it rebuilds our memory in order to store and retrieve things. This is important because when we store or retrieve things, we need to use our working memory in order to hold the data we are using. Very similar to a computer, isn’t it?

However our working memory is a pretty different thing than our long-term memory. So, let me show you a model to explain it.

This is a model of working memory. Some call it “short-term memory”, and others “working memory”… I think you could see it as a processor, with some registers that can store a limited quantity of information units called chunks while working. Chunks can have variable size, but they are meaningful. 

Do you remember a phone number? I bet you group the digits to have only two or three numbers to retain.

That’s because our processor can manage a limited number of chunks. Something around seven (plus or minus two), This varies with age and individuals, but it is a very good approximation. So, we try to save as much “registers” as possible, grouping information in chunks, and leaving some of them free.

So, our octopus is a good model with its eight legs.
What happens if we fill up all the legs? Well, task precision and performance decreases, errors increase. In general, we perform worse if we try to maintain many things in our working memory at the same time.

Of course, this is an over simplification. However, I think you could get the big picture. We can reduce the overload if we put knowledge in the world, instead of maintaining it in our head, and we will perform better at any task by doing so.

You can put some knowledge out of the working memory by practice. That’s why when we introduce a new technique, language feature, tool, etc, we need to go slower and we have some more errors in our work. We need time to automate things in our mind while putting knowledge in the world.

In our work we need to manage tasks that cannot be automated, we work in tasks that are new every time.

And now, it’s time to return to the main goal of this talk. Let’s talk about a developer’s life.

Let’s analyze for a moment what happens when we program without tests…

In fact, we always do tests, but we tend to do manual testing. This is what we call debugging. We use a trial and error process… Does this work? No?… try again. Yes? Go ahead.

The process is best reflected in this picture. We try to write code and verify that this code works as we want at the same time we write it, until we think it’s done. After that, we try to verify that the code works as a whole, and, then, we remember that we forgot some details… We deploy, and we discover new details that don’t work, so we need to fix them.

At the end of the day we’ll find ourselves with big headaches and under the impression of having missed something. 

This happens because we try to manage all the information in our head at the same time (remember, it is limited), we overcharge ourselves. The best strategy is to write down goals, subtasks, helping us with these external aids.

For example: a simple endpoint for an API could need a lot of things:

1. A controller action
2. A route to this controller action
3. A use case or command object to perform the action
4. Probably an entity (or more) and the repository
5. The repository DIC definition
5. Maybe a service
6. The service DIC definition
7. A response object

Our memory becomes overcharged. This explains why we feel tired and stressed, and with the feeling that we may have forgotten something, and unsecure about what we are doing or if we have left out something important.

So, let’s take a look at how we would execute the same process, this time with testing at the end.

Well. This looks familiar, but now there are tests at the end of the process. The kind of tests we automate.

The end result is better, because we are more confident about our code thanks to the tests. But we have the same headache at the end of the day. 

Yes, we have been doing the same amount of work, with the same memory overload and with the addition of having to write a bunch of tests, while our brain is screaming: “Hey, dude, work is done! What the heck are you doing?“

In that conditions, maybe our tests are not the best tests in the world…

In fact, we are already tired when we start the testing phase.
This explains why many people think that testing is hard and that it hurts.

So, tests improve our confidence in the code, at the cost of lots of extra work. Our life is not better with tests, even if we sleep better at night…
What’s wrong?

To really improve your life, you should try a different approach. You should do TDD.

This is the TDD cycle: one thing at a time (and to postpone decisions):

* A simple test that fails (don’t write code until you have a test)
* Code to make that simple test to pass (don’t write anything more or less than what is needed)
* Review the code to improve things, like naming, architecture, apply patterns, reduce duplication, but don’t implement anything new keeping the tests in green state.

Here you can see the process from the point of view of our working memory model. When we write the first failing test we are focused on that test. So we don’t want to pay attention to anything out of this. Writing the tests also means that we are putting the knowledge we will need in the world. Our memory is almost free.

Next, we focus on writing the code needed to make the test pass. The knowledge we need is in the test, that happens to be the goal of our task, so it is in the world, not in our head.

We only have to think in a way to make the test pass, so, if it is the first test, we only need to write the more obvious implementation that is possible. Even if that implementation is one as simple as to directly return the value expected by the test. Don’t need to worry about anything else.

And then, once the test has passed, we can take a look at the code and see if we can make some improvements via refactoring. We don’t have to add features. We must keep the test passing while tiding things, removing undesired duplication, etc.

We’ll repeat the cycle till we have the feature fully implemented. We don’t need to write extra tests, we don’t have the risk of forgetting something. Our head doesn’t hurt. We have used our brain to think, avoiding memory overload.

It’s not magic, it’s TDD. Of course, to achieve this needs some training. TDD is an intellectual tool, and tool use needs to be automated. 
Therefore, you should be doing exercises, like katas, both for yourself, both with some colleagues’ help, in a community of practice… whatever fits you or your team. Practice, practice and practice. Once you are able to proceed step by step, you will discover that not only things become easier, but you will be happier and less stressed in the long term.

Then, let me show you an example (live demo, for example the NIF value object kata).

Store the most of knowledge you need in the world: use a backlog, post-its, write-down a list of tasks, draw schemas, models, concept maps…

Free your head to leave room to work on one thing at a time.

TDD is more than tests. It is to put the knowledge you need in the code (in the world) and free your mind.

It is to postpone decisions to the time when you are ready to make them. 
Really, try TDD, your life as developer will improve.
