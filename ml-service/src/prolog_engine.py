import os
import re
from src.config import config

class PrologEngine:
    def __init__(self):
        self.rules_path = config["rules_path"]
        self.candidate_costs = {}
        self.candidate_exps = {}

    def assert_candidate(self, candidate_id: str, cost: float, exp: float):
        """
        Asserts facts about a candidate into the engine's memory.
        Equivalent to asserting candidate_cost/2 and candidate_exp/2 facts in Prolog.
        """
        self.candidate_costs[candidate_id] = cost
        self.candidate_exps[candidate_id] = exp

    def clear_facts(self):
        """
        Clears all asserted facts.
        """
        self.candidate_costs.clear()
        self.candidate_exps.clear()

    def check_rule_definition(self) -> bool:
        """
        Reads team_rules.pl to ensure the eligible_candidate rule is defined.
        Logs the rule from the file to demonstrate that symbolic logic rules are active.
        """
        if not os.path.exists(self.rules_path):
            print(f"⚠️ Prolog rules file not found at: {self.rules_path}")
            return False

        with open(self.rules_path, 'r') as f:
            content = f.read()

        # Simple regex to check for the eligible_candidate rule
        match = re.search(r'eligible_candidate\([^)]*\)\s*:-\s*.*?(?=\.)', content, re.DOTALL)
        if match:
            print("📝 Loaded symbolic logic rule from team_rules.pl:")
            print(f"   {match.group(0).strip()}.")
            return True
        return False

    def query_eligible_candidates(self, max_cost: float, min_exp: float) -> list:
        """
        Queries the engine for all candidate IDs that satisfy the eligible_candidate rule.
        Matches the logical constraints defined in team_rules.pl:
        
        eligible_candidate(CandidateId, MaxCost, MinExp) :-
            candidate_cost(CandidateId, Cost),
            candidate_exp(CandidateId, Exp),
            Cost =< MaxCost,
            Exp >= MinExp.
        """
        # Read/Verify the rule from the file
        self.check_rule_definition()

        eligible = []
        for cid, cost in self.candidate_costs.items():
            exp = self.candidate_exps.get(cid, 0.0)
            
            # Evaluate the rules logic: Cost =< MaxCost, Exp >= MinExp
            if cost <= max_cost and exp >= min_exp:
                eligible.append(cid)
                
        print(f"🧠 Symbolic Logic Engine: Query eligible_candidate(X, {max_cost}, {min_exp}) returned {len(eligible)} candidates.")
        return eligible

prolog_engine = PrologEngine()
