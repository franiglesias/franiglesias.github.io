---
layout: post
title: Fifty Quick Ideas to Improve Your Tests
categories: articles
tags: tb-list testing
---

Este librito de Gojko Adzic, David Evans y Tom Roden ($10 en [Leanpub]((https://leanpub.com/50quickideas-tests))) propone exactamente 50 ideas a considerar para diseñar nuestra estrategia de testing. Me encanta particularmente esta serie de heurísticas emocionales para decidir qué tests hacer. Sencillamente genial:


> Here is our set of emotional heuristics to stimulate test design, taking an emotional roller coaster of a ride along the way:
> 
> The scary path – if this path was followed it would really tear the house down, and everything else with it. Flush out those areas of the highest risk to the stakeholders. Think what would scare each stakeholder the most about this piece of functionality or change.
> 
> The happy path – the key example, positive test, that describes the straightforward case. This is the simplest path through the particular area of behaviour and functionality that we can think of, it is the simplest user interaction and we expect it to pass every time (other than its first ever run maybe).
> 
> The angry path – with the angry path we are looking for tests which we think will make the application react badly, throw errors and get cross with us for not playing nicely. These might be validation errors, bad inputs, logic errors.
> 
> The delinquent path – consider the security risks that need testing, like authentication, authorisation, permissions, data confidentiality and so on.
> 
> The embarrassing path – think of the things that, should they break, would cause huge embarrassment all round. Even if they wouldn’t be an immediate catastrophe in loss of business they might have a significant impact on credibility, internally or externally. This could be as simple as something like spelling quality as ‘Qality’, as we once saw on a testing journal (just think of the glee on all those testers’ faces).
> 
> The desolate path – provide the application or component with bleakness. Try zeros, nulls, blanks or missing data, truncated data and any other kind of incomplete input, file or event that might cause some sort of equally desolate reaction.
> 
> The forgetful path – fill up all the memory and CPU capacity so that the application has nowhere left to store anything. See how forgetful it becomes and whether it starts losing data, either something that had just been stored, or something it was already holding.
> 
> The indecisive path – simulate being an indecisive user, unable to quite settle on one course of action. Turn things on and off, clicking back buttons on the browser, move between breadcrumb trails with half-entered data. These kinds of actions can cause errors in what the system remembers as the last known state.
> 
> The greedy path – select everything, tick every box, opt into every option, order lots of everything, just generally load up the functionality with as much of everything as it allows to see how it behaves.
> 
> The stressful path – find the breaking point of the functions and components so you can see what scale of solution you currently have and give you projections for future changes in business volumes.
> 


[Fifty Quick Ideas to Improve Your Tests](https://leanpub.com/50quickideas-tests)
