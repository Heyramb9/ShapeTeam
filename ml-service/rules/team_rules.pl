% ShapeTeam Candidate Eligibility Rules

% candidate_cost(CandidateId, Cost).
% candidate_exp(CandidateId, ExperienceYears).

eligible_candidate(CandidateId, MaxCost, MinExp) :-
    candidate_cost(CandidateId, Cost),
    candidate_exp(CandidateId, Exp),
    Cost =< MaxCost,
    Exp >= MinExp.
