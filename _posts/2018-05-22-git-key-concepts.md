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

Empty folders doesn't count until they get some files (or loss all of them).

But changes by themselves are not enough. You need to tell git to put an eye on them, tracking the files. You can do that doing:

```bash
git add <replace this with the files changed>
```
This will stage the changes.

Here are some examples:

```bash
git add readme.md // Will add the readme.md file

git add src/MyClass  // Will add all changes under folder src/MyClass

git add -all // Will add all the changes detected
git add . // Will add all the changes detected
```

Whenever a file changes, it will be considered *changed*, but it's no until you stage the change that it will be taken into account in order to "remember" it.

In fact, if you continue modifying a concrete file after it is added, the new content won't be part of the next commit, you must add them again to register the new changes.

So, changes are provisional, to say something. To fix a point in the story you must **commit** the changes you've made.

### Commit

A **commit** is a way to register a set of changes in the versioning system. It can have from one change to dozens affecting several files. A commit makes permanent those changes.

A commit, then, *is a point in the story of a repository*. It has a name or id that identifies uniquely and can have a message that describes the meaning of the changes.

You decide *what* to commit by adding changes to the stage.

You decide *when* to commit by doing this:

```bash
git commit -m "Commit message"
```
The commit message is an humane readable description of the changes you want to register. It's recommended to write in imperative mode and, ideally, the changes commited should be undoable in a single step (i.e: removing that commit from the history).

### Remote

A repository is a local folder that contains your work and register its changes every time you commit them.

But, what if you want to share you work with others? Or if you want to access it from several computers?

What you need then is a **remote** repository that is synched with your local one, so the changes you make locally will be reflected in the remote, and you, or others, could get that changes from the remote to be applied into your local.

The most popular place to store remote repositories is [Github](http://github.com), but it's no the only one. In fact, you could share your repo in a [local network](https://git-scm.com/book/it/v2/Git-on-the-Server-Setting-Up-the-Server).

[You can set up a project into github from the command line](https://help.github.com/articles/adding-an-existing-project-to-github-using-the-command-line/) os simply go to the [Github](http://github.com) page to do so.

Once your local repository and the remote are synched, you could share and get the changes.

Usually, and by default, remote is named **origin**.

After you commit you can share the changes with the remote using push.

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

Many times you'll want to explore things or work on your project without touch the work you have done until the moment.

In that case, a good thing to do is to create a **branch**.

A branch is a deviation from the course of history reflected by master. The master branch and the new one can evolve differently starting in the same commit. Some time in the future you could merge them again but, for now, you can change things in one of the branches without affecting the other.

Imagine you have a succession of commits like this:

```
m1---m2---m3--m4
```

You decide to start a new branch at **m4** commit so you can create a new feature without affecting or modifying the current code in master. Now, the m4 commit exists both in master and the branch, so git is able to know the las common point of the history.

```
m1--m2--m3--m4 (master)
             |
            m4 (branch)
```


Then, you add changes to this branch:

```
m1--m2--m3--m4------------ (master)
             |
            m4--b1--b2--b3 (branch)
```

If you don't perform any change in master, you could easily merge the b branch again into master, applying the b* commits into master.

```
m1--m2--m3--m4--b1--b2--b3 (master after branch merged)
```

But it is possible to work in the master branch, and make another changes while not affecting the work in the b branch.

```
m1--m2--m3--m4--m5--m6------ (master)
             |
            m4--b1--b2--b3-- (branch)
```

The problem comes later, when you want to merge b branch into master. Perhaps some of the changes affects in different ways, so we probably will find **conflicts**.

### Conflict

A conflict appears when different changes are applied to the same objects.

Consider the previous example:

```
m1--m2--m3--m4--m5--m6
             |
            m4--b1--b2--b3
```

Imagine that commit **m5** changes a file named **User.php**, and commit **b2** changes the same file. Those changes could conflict if affecting to the same code lines. Working in b branch you don't know that those changes have been made, so you aren't taking them into account.

The conflict arises when you want to apply your own changes to the master branch and git finds that it is unable to merge the changes in file User.php because it doesn't know which of them should prevail.

Sometimes, git can apply changes from both branches because they affect to different parts of the files. We say that they are no conflicting changes. The rest of the time, git will need your help to decide how to perform the merge, so it notifies there are conflicts that you must resolve before proceed.

Resolving a conflict means that you create a new set of changes defining a new version of the code where you have chosen what better suits to the needs of your program or even rewrite the code entirely. After that, you mark the conflict as resolved by adding de changes and committing as usual.

### Preventing conflicts

In an environment with several developers working in the very same files it could happen that master branch evolves at the same time you are working in a branch, while other devs are merging changes to the master. So, it's easy that some concrete changes in master could potentially affect files which you are modifying in your own branch.

One way to prevent this is merging or rebasing the master into your branch frequently, so code is up to date to the last changes while you advance with your work.

#### Merge

Imagine this state of master and branch:

```
m1--m2--m3--m4----m5---m6---- (master)
             |
            m4--b1--b2--b3-- (branch)
```

To perform the merge

```bash
git checkout branch
git merge master (or origin master)

>>> Conflict
```

This will bring the changes in master to the branch, trying to put the commits in chronological order:

```
m1--m2--m3--m4----m5------m6---- (master)
             |     \       \
            m4--b1--m5--b2--m6--b3-- (branch)
```

Resolve conflicts if any, add the changes and commit:

```bash
git add .
git commit -m "Resolve conflict between master and branch..."
```

Merge branch into master to integrate branch into master

```bash
git checkout master
git merge branch
```

```
m1--m2--m3--m4--b1--m5--b2--m6--b3-- (master)
```

You should be done if no other changes were applied to master.

#### Rebase

Rebase is a way to rebuild the history of your branch rewinding the head to the last common commit with master (the point in the history where you created your branch) then applying all the changes in master, creating a new common point, and finally applying the changes in your branch.

If conflict arise during this process you resolve them one by one and get a clean branch with both the changes from master and from your branch applied. This way, if you want to merge your changes into master you will find no conflicts. All the management of conflicts happened in the context of your branch. 

It is important to note that rebasing is a delicate question when you are working on a published branch. If you are rebasing a local only branch you are safe. But if you are rebasing a published branch you are effectively changing the existing commits, moving them in the timeline and replacing them with new ones but containing the same changes. If another person is working with the same branch it is very easy to create a mess of duplicated conflicts. So, our recommendation is to communicate with your partner and coordinate actions.

To perform a rebase we start here:

```
m1--m2--m3--m4--m5--m6 (master)
             |
            m4--b1--b2--b3 (branch)
```

And we will get this:

```
m1--m2--m3--m4--m5--m6 (master)
                    |  (new common point in history)
                    m6--b1'--b2'--b3' (branch with moved commits)
```

The commits' names (called hashes) change because they are **new commits** (containing the same changes) and they **happen in another point in time**. The result when merging will be like this:

```
m1--m2--m3--m4--m5--m6--b1'--b2'--b3'
```

To perform the rebase

```bash
git checkout branch
git pull --rebase [origin] master

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

**Important**: if you are rebasing a public branch (a branch that was previously pushed to the shared repository) git will you warn about the diverging history of local and remote repositories. In fact, git will suggest you to pull the remote changes: **don't do that!** If you pull changes you will mess your local branch with duplicated commits and a total nightmare.

If you are ok with the changes you perform a forced push, to rewrite the history in the remote branch:

```
git push --force
```

After rebase, you can checkout master and merge the another branch as usual:

```bash
git checkout master
git merge branch
```

And you will get

```
m1--m2--m3--m4--m5--m6--b1'--b2'--b3'
```

