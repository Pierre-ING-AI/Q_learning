# Qlearning

## Introduction 
<img width="1059" height="600" alt="image" src="https://github.com/user-attachments/assets/3a11bda0-0ccd-4fd7-84cc-0963eaa8d047" />

### Model-Based RL

Unlike model-free RL, there aren’t a small number of easy-to-define clusters of methods for model-based RL: there are many orthogonal ways of using models. We’ll give a few examples, but the list is far from exhaustive. In each case, the model may either be given or learned.

Background: Pure Planning. The most basic approach never explicitly represents the policy, and instead, uses pure planning techniques like model-predictive control (MPC) to select actions. In MPC, each time the agent observes the environment, it computes a plan which is optimal with respect to the model, where the plan describes all actions to take over some fixed window of time after the present. (Future rewards beyond the horizon may be considered by the planning algorithm through the use of a learned value function.) The agent then executes the first action of the plan, and immediately discards the rest of it. It computes a new plan each time it prepares to interact with the environment, to avoid using an action from a plan with a shorter-than-desired planning horizon.

    The MBMF work explores MPC with learned environment models on some standard benchmark tasks for deep RL.

Expert Iteration. A straightforward follow-on to pure planning involves using and learning an explicit representation of the policy, $\pi_{\theta}(a|s)$. The agent uses a planning algorithm (like Monte Carlo Tree Search) in the model, generating candidate actions for the plan by sampling from its current policy. The planning algorithm produces an action which is better than what the policy alone would have produced, hence it is an “expert” relative to the policy. The policy is afterwards updated to produce an action more like the planning algorithm’s output.

    The ExIt algorithm uses this approach to train deep neural networks to play Hex.
    AlphaZero is another example of this approach.

Data Augmentation for Model-Free Methods. Use a model-free RL algorithm to train a policy or Q-function, but either 1) augment real experiences with fictitious ones in updating the agent, or 2) use only fictitous experience for updating the agent.

    See MBVE for an example of augmenting real experiences with fictitious ones.
    See World Models for an example of using purely fictitious experience to train the agent, which they call “training in the dream.”

Embedding Planning Loops into Policies. Another approach embeds the planning procedure directly into a policy as a subroutine—so that complete plans become side information for the policy—while training the output of the policy with any standard model-free algorithm. The key concept is that in this framework, the policy can learn to choose how and when to use the plans. This makes model bias less of a problem, because if the model is bad for planning in some states, the policy can simply learn to ignore it.
### Model-Free RL

There are two main approaches to representing and training agents with model-free RL:

**Policy Optimization.** Methods in this family represent a policy explicitly as $\pi_{\theta}(a|s)$. They optimize the parameters $\theta$ either directly by gradient ascent on the performance objective $J(\pi_{\theta})$, or indirectly, by maximizing local approximations of $J(\pi_{\theta})$. This optimization is almost always performed on-policy, which means that each update only uses data collected while acting according to the most recent version of the policy. Policy optimization also usually involves learning an approximator $V_{\phi}(s)$ for the on-policy value function $V^{\pi}(s)$, which gets used in figuring out how to update the policy.

A couple of examples of policy optimization methods are:

    A2C / A3C, which performs gradient ascent to directly maximize performance,
    and PPO, whose updates indirectly maximize performance, by instead maximizing a surrogate objective function which gives a conservative estimate for how much J(\pi_{\theta}) will change as a result of the update.

** Q-Learning.** Methods in this family learn an approximator $Q_{\theta}(s,a)$ for the optimal action-value function, Q^*(s,a). Typically they use an objective function based on the Bellman equation. This optimization is almost always performed off-policy, which means that each update can use data collected at any point during training, regardless of how the agent was choosing to explore the environment when the data was obtained. The corresponding policy is obtained via the connection between $Q^*$ and $\pi^*$: the actions taken by the Q-learning agent are given by

$$a(s) = \arg \max_a Q_{\theta}(s,a).$$

Examples of Q-learning methods include

    DQN, a classic which substantially launched the field of deep RL,
    and C51, a variant that learns a distribution over return whose expectation is Q^*.

Trade-offs Between Policy Optimization and Q-Learning. The primary strength of policy optimization methods is that they are principled, in the sense that you directly optimize for the thing you want. This tends to make them stable and reliable. By contrast, Q-learning methods only indirectly optimize for agent performance, by training $Q_{\theta}$ to satisfy a self-consistency equation. There are many failure modes for this kind of learning, so it tends to be less stable. [1] But, Q-learning methods gain the advantage of being substantially more sample efficient when they do work, because they can reuse data more effectively than policy optimization techniques.

Interpolating Between Policy Optimization and Q-Learning. Serendipitously, policy optimization and Q-learning are not incompatible (and under some circumstances, it turns out, equivalent), and there exist a range of algorithms that live in between the two extremes. Algorithms that live on this spectrum are able to carefully trade-off between the strengths and weaknesses of either side. Examples include

    DDPG, an algorithm which concurrently learns a deterministic policy and a Q-function by using each to improve the other,
    and SAC, a variant which uses stochastic policies, entropy regularization, and a few other tricks to stabilize learning and score higher than DDPG on standard benchmarks.

### Projet Subject
Create a Q learning algorithm
<img width="847" height="534" alt="image" src="https://github.com/user-attachments/assets/cd6a7c9e-2fa2-4fbe-9b14-ee357ed0db2b" />

# Bibliography
https://spinningup.openai.com/en/latest/spinningup/rl_intro2.html
## Algorithms
| Number | Name |
|:-------- |:--------:|
| Left     | Center   | Right    |
|2|	A2C / A3C (Asynchronous Advantage Actor-Critic): Mnih et al, 2016|
|3|	PPO (Proximal Policy Optimization): Schulman et al, 2017|
|4|	TRPO (Trust Region Policy Optimization): Schulman et al, 2015|
|5|	DDPG (Deep Deterministic Policy Gradient): Lillicrap et al, 2015|
|6|	TD3 (Twin Delayed DDPG): Fujimoto et al, 2018|
|7|	SAC (Soft Actor-Critic): Haarnoja et al, 2018|
|8|	DQN (Deep Q-Networks): Mnih et al, 2013|
|9| 51 (Categorical 51-Atom DQN): Bellemare et al, 2017|
|10|	QR-DQN (Quantile Regression DQN): Dabney et al, 2017|
|11|	HER (Hindsight Experience Replay): Andrychowicz et al, 2017|
|12|	World Models: Ha and Schmidhuber, 2018|
|13|	I2A (Imagination-Augmented Agents): Weber et al, 2017|
|14|	MBMF (Model-Based RL with Model-Free Fine-Tuning): Nagabandi et al, 2017|
|15|	MBVE (Model-Based Value Expansion): Feinberg et al, 2018|
|16|	AlphaZero: Silver et al, 2017|
