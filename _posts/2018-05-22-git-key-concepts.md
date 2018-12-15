---
layout: post
title: Some key concepts on Git
published: true
categories: articles
author: [paula, fran]
tags: tools
---

Some key concepts explained to know what's happening when you work with this VCS.

### Repository

The place where you store your work.  At first, it's a folder on your computer. When you add version control, the folder becomes a repository and can keep track of the **changes** you make.

You create a local repository by moving to it and telling git to init.

```bash
mkdir myProject
cd myProject

git init
```

More on this later.

### Changes

Changes are modifications to the contents of the **repository**. These can be of three types:

* Addition of files
* Deletion of files
* Modification of files

Empty folders don't count until they get some files (or lose all of them).

But changes by themselves are not enough. You need to tell git to put an eye on them, tracking the files. You can do that doing:

```bash
git add <replace this with the files changed>
```
This will stage the changes. You can either give the add command the absolute path to a specific file, or take advantage of relative paths.

Here are some examples:

```bash
git add readme.md // Will add the readme.md file

git add src/MyClass  // Will add all changes under folder src/MyClass

git add --all // Will add all the changes detected plus any untracked file
git add . // Will add all the changes detected under the current directory
```

Whenever a file changes, it will be considered *changed*, but it's no until you stage the change that it will be taken into account in order to "remember" it.

In fact, if you continue modifying a concrete file after it is added, the new content won't be part of the next commit, you must add them again to register the new changes.

So, changes are provisional, so to speak. To fix a point in the git history you must **commit** the changes you've made.

### Commit

A **commit** is a way to register a set of changes in the versioning system. It can range from the tiniest change on a single file to dozens affecting several files. A commit makes permanent those changes.

A commit, then, *is a point in the history of a repository*. It has a name or id that identifies it uniquely and can have a message that describes the meaning of the changes.

You decide *what* to commit by adding changes to the stage.

You decide *when* to commit by doing this:

```bash
git commit -m "Commit message"
```
The commit message is an human readable description of the changes you want to register. It's recommended to write it in imperative mode and, ideally, the changes committed should be undoable in a single step (i.e: removing that commit from the history).

### Remote

A repository is a local folder that contains your work and register its changes every time you commit them.

But, what if you want to share your work with others? Or if you want to access it from several computers?

What you need then is a **remote** repository that is synchronized with your local one, so the changes you make locally will be reflected in the remote, and you, or others, could get that changes from the remote to be applied into your local.

The most popular place to store remote repositories is [Github](http://github.com), but it's no the only one. In fact, you could share your repository in a [local network](https://git-scm.com/book/it/v2/Git-on-the-Server-Setting-Up-the-Server).

[You can set up a project into github from the command line](https://help.github.com/articles/adding-an-existing-project-to-github-using-the-command-line/) or simply go to the [Github](http://github.com) page to do so.

Once your local repository and the remote are synchronized, you could share and get the changes.

Usually, and by default, remote is named **origin**.

After you commit you can update the remote with those changes using push.

```bash
git push origin
```

If you want to update your local repository with the latest published changes you pull them.

```bash
git pull
```

### Master

The succession of commits is the history of your project. From the beginning this history happens in a branch called **master**. Every time you perform a commit a new point in the history is set with an id to name it.

You can rewind to a certain point in the history if you want or need it. A pointer to the current commit, or point in the history, is called HEAD.

But you don't have to limit yourself to only one **branch**.

### Branches

Many times you'll want to explore things or work on your project without having to mess around with the work you have done until that moment.

In that case, a good thing to do is to create a **branch**.

A branch is a deviation from the course of history reflected by master. The master branch and the new one can evolve differently from that point in history. Some time in the future you could merge them again but, for now, you can change things in one of the branches without affecting the other.

Imagine you have a succession of commits like this:

```
m1--m2--m3--m4
```

You decide to start a new branch named b at **m4** commit so you can create a new feature without affecting or modifying the current code in master. Now, all the commits leading to the m4 commit exist both in master and the branch. Prior to making any new commits on the new branch, both are, at this point, effectively equal. But sharing a common past will allow git further on in history to find their last common ancestor, which in this case will be the tip of master when the branch was created, the m4 commit.

```
m1--m2--m3--m4 (master)
             |
             (branch b)
```


Then, you add changes to this branch:

```
m1--m2--m3--m4-------- (master)
             |
            b1--b2--b3 (branch b)
```

If you don't perform any change in master, you could easily merge the branch b back into master, applying its commits into master.

```
m1--m2--m3--m4--b1--b2--b3 (master after branch b merged)
```

But it is possible to work in the master branch, and make other changes while not affecting the work in the b branch.

```
m1--m2--m3--m4--m5--m6------ (master)
             |
            b1--b2--b3-- (branch b)
```

The problem comes in later, when you want to merge branch b into master. Perhaps some of the changes affect the same files of your code base, possibly even in different ways. If that happens, you will have to face a few git **conflicts**.

### Conflict

A conflict appears when different changes are applied to the same objects.

Consider the previous example:

```
m1--m2--m3--m4--m5--m6
             |
            b1--b2--b3
```

Imagine that commit **m5** changes a file named **User.php**, and commit **b2** changes the same file. Working in b branch you don't know that those changes have been made, so you aren't taking them into account.

The conflict arises when you want to apply your own changes to the master branch and git finds out that it is unable to merge the changes in file User.php because it doesn't know which of them should prevail.

Resolving a conflict means that you create a new set of changes defining a new version of the code where you have chosen what better suits the needs of your program or even rewritten the code entirely. After that, you mark the conflict as resolved by adding the changes and committing them as usual.

### Preventing conflicts

In an environment with several developers working in the very same files it will happen that the master branch evolves while you are working in a different branch, as other devs are merging changes to master. So, it's easy that some of those changes in master could potentially affect the same files you are modifying in your own branch.

One way to better deal with the conflicts this will provoke this is merging or rebasing the master into your branch frequently. This way your code is up to date with the last changes while you advance with your work, and if you are unsure about some of the conflicts you're finding, probably the dev who wrote them will be around and will be able to explain them,

#### Merge

Imagine this state of master and branch b:

```
m1--m2--m3--m4----m5---m6---- (master)
             |
            b1--b2--b3-- (branch b)
```

To perform the merge

```bash
git checkout branch
git merge master (or origin master)

>>> Conflict
```

This will identify the changes that have occurred in master since the last common ancestor (remember that was the commit m4 on our example), and replay them on top of the branch b, applying them. As a result, a new commit b4 will appear on the branch b, that contains this set of changes.

```
m1--m2--m3--m4--m5--m6---- (master)
             |         \
            b1--b2--b3--b4(merge commit) (branch b)
```

Resolve conflicts if any, add the changes and commit:

```bash
git add .
git commit -m "Resolve conflicts between master and branch..."
```

Much in the same way, if you want to integrate the changes you've been working on on branch b into master, you can merge b into master. This will bring in the changes, creating a new merge commit in master, m7.

```bash
git checkout master
git merge branch
```

```
m1--m2--m3--m4--m5--m6--m7 (master)
             |          /
             b1--b2--b3 (branch b)
```

You should be done if no other changes were applied to master.

#### Rebase

Rebase is a way to rebuild the history of your branch rewinding the head to the last common commit with master (the point in the history where you created your branch) then applying all the changes in master, creating a new common point, and finally applying the changes in your branch.

If conflicts arise during this process you resolve them one by one and get a clean branch with both the changes from master and from your branch applied. This way, if you want to merge your changes into master you will find no conflicts. All the management of conflicts happened in the context of your branch.

It is important to note that rebasing is a delicate question when you are working on a published branch. If you are rebasing a local only branch you are safe. But if you are rebasing a published branch you are effectively changing the existing commits, moving them in the timeline and replacing them with new ones but containing the same changes. If another person is working with the same branch it is very easy to create a mess of duplicated conflicts. So, our recommendation is to communicate with your partner and coordinate actions.

To perform a rebase we start here:

```
m1--m2--m3--m4--m5--m6 (master)
             |
            b1--b2--b3 (branch)
```

And we will get this:

```
m1--m2--m3--m4--m5--m6 (master)
                    |  (new common point in history)
                    b1'--b2'--b3' (branch with moved commits)
```

The commits' names (called hashes) change because they are **new commits** (containing the same changes) and they **happen in another point in time**. The result when merging will be like this:

```
m1--m2--m3--m4--m5--m6--b1'--b2'--b3'
```

To perform the rebase

```bash
git checkout branch
git pull --rebase [origin] master //if you are rebasing over the remote version of the branch

>>> Conflict
```

or

```bash
git checkout master
git pull
git checkout branch
git rebase master //if you are rebasing over the local version of the branch, make sure to have it pulled from the remote before

>>> Conflict
```

Make the changes needed to resolve the conflict. Then, continue rebasing until there are no conflicts left and the process end.

```bash
git rebase --continue
```

If after applying a commit there are no changes and the rebase hasn't finished, use --skip instead of --continue:

```bash
git rebase --skip
```

**Important**: if you are rebasing a public branch (a branch that was previously pushed to the shared repository) git will you warn about the diverging history of local and remote repositories. In fact, git will suggest you pull the remote changes: **don't do that!** If you pull changes you will mess your local branch with duplicated commits and it'll become a total nightmare.

If you are certain the local history on your computer is the one you want to keep, you go on and do a forced push, to rewrite the history in the remote branch:

```
git push --force
```

After rebase, you can checkout master and merge the other branch as usual:

```bash
git checkout master
git merge branch
```

And you will get

```
m1--m2--m3--m4--m5--m6--b1'--b2'--b3'
```

In short, if you've been careful with your code, you should end up with the exact same version of your code base, regardless of whether you chose to use git merge, git rebase or a combination of both. The log of the history of your repository might look wildly different though, even if the code itself is exactly the same. As for which one you should be using, each developer has their own preference. But it is essential that you do have a clear git workflow if you are going to work with a whole team of other developers, to avoid tears over misunderstood changes in the code. Most things in git can be sorted out or undone, but you don't want to have to do it anyway.


If you are curious now about what your own repositories' histories look like, you can run this, and see if you can really understand what's been going on lately over there:

```bash
git log --oneline --graph
```

Happy git exploring!
