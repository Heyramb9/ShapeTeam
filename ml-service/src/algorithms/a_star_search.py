import heapq
from typing import List, Dict, Tuple, Any

class TeamState:
    def __init__(self, assigned: Dict[int, Dict[str, Any]], g_score: float, h_score: float, depth: int):
        self.assigned = assigned  # index -> candidate details
        self.g_score = g_score    # accumulated cost (cost - w * fit)
        self.h_score = h_score    # heuristic estimated remaining cost
        self.f_score = g_score + h_score
        self.depth = depth

    def __lt__(self, other):
        return self.f_score < other.f_score

def optimize_team_a_star(
    required_roles: List[str],
    candidates: List[Dict[str, Any]],
    budget_limit: float,
    weight_fit: float = 1.5,
    max_candidates_per_role: int = 50
) -> Tuple[List[Dict[str, Any]], float, float]:
    """
    Performs A* Search to find the optimal combination of candidates for required_roles.
    
    g(n) = sum(costPerHour - w * fitScore) for selected candidates
    h(n) = sum(min(costPerHour - w * fitScore)) for remaining required roles
    
    Returns:
        (selected_candidates_list, total_cost, optimality_score)
    """
    # 1. Group candidates by role and pre-sort them to speed up selection
    candidates_by_role: Dict[str, List[Dict[str, Any]]] = {}
    for c in candidates:
        role = c["role"]
        if role not in candidates_by_role:
            candidates_by_role[role] = []
        candidates_by_role[role].append(c)

    # Sort each role's pool by (costPerHour - weight * fitScore) ascending (best first)
    for role, pool in candidates_by_role.items():
        pool.sort(key=lambda x: (x["costPerHour"] - weight_fit * (x["fitScore"] or 0)))
        # Prune to keep only top candidates to keep state space search fast
        candidates_by_role[role] = pool[:max_candidates_per_role]

    # 2. Pre-calculate minimum possible cost-fit value for each required role to form the heuristic
    # This ensures our heuristic is admissible and consistent
    min_cost_fit_by_role: Dict[str, float] = {}
    for role in set(required_roles):
        pool = candidates_by_role.get(role, [])
        if pool:
            min_cost_fit_by_role[role] = pool[0]["costPerHour"] - weight_fit * (pool[0]["fitScore"] or 0)
        else:
            min_cost_fit_by_role[role] = 99999.0  # High penalty if no candidate for role

    # Helper to calculate h(n) for remaining roles starting from a given index
    def calculate_heuristic(start_depth: int) -> float:
        h = 0.0
        for i in range(start_depth, len(required_roles)):
            role = required_roles[i]
            h += min_cost_fit_by_role.get(role, 99999.0)
        return h

    # Initialize A* Search
    start_h = calculate_heuristic(0)
    start_state = TeamState(assigned={}, g_score=0.0, h_score=start_h, depth=0)
    
    pq = [start_state]
    heapq.heapify(pq)

    best_state: TeamState = None

    while len(pq) > 0:
        current: TeamState = heapq.heappop(pq)

        # Goal check: All roles filled
        if current.depth == len(required_roles):
            best_state = current
            break

        next_role = required_roles[current.depth]
        available_candidates = candidates_by_role.get(next_role, [])
        
        assigned_ids = {c["id"] for c in current.assigned.values()}

        # Transition: Branch by assigning an available candidate
        for c in available_candidates:
            if c["id"] in assigned_ids:
                continue  # Prevent duplicate assignment of the same candidate

            # Calculate accumulated team cost if we assign this candidate
            current_total_cost = sum(x["costPerHour"] for x in current.assigned.values()) + c["costPerHour"]
            
            # Prune states that violate budget constraint
            if current_total_cost > budget_limit:
                continue

            # Compute transition costs
            cand_cost_fit = c["costPerHour"] - weight_fit * (c["fitScore"] or 0)
            new_g = current.g_score + cand_cost_fit
            new_h = calculate_heuristic(current.depth + 1)

            new_assigned = current.assigned.copy()
            new_assigned[current.depth] = c

            new_state = TeamState(
                assigned=new_assigned,
                g_score=new_g,
                h_score=new_h,
                depth=current.depth + 1
            )
            heapq.heappush(pq, new_state)

    if not best_state:
        # Fallback if no solution found under budget constraints
        return [], 0.0, 0.0

    # Format result
    selected_candidates = []
    total_cost = 0.0
    total_fit = 0.0

    for idx, c in sorted(best_state.assigned.items()):
        selected_candidates.append({
            "candidate_id": c["id"],
            "assigned_role": required_roles[idx],
            # Pass details back for UI presentation
            "fullName": c["fullName"],
            "role": c["role"],
            "experienceYears": c["experienceYears"],
            "costPerHour": c["costPerHour"],
            "availabilityHrs": c["availabilityHrs"],
            "fitScore": c["fitScore"],
            "skills": c["skills"]
        })
        total_cost += c["costPerHour"]
        total_fit += (c["fitScore"] or 0)

    # Derive optimality score (e.g. average fit percentage adjusted by budget efficiency)
    avg_fit = total_fit / len(required_roles) if required_roles else 0.0
    cost_efficiency = (budget_limit - total_cost) / budget_limit if budget_limit > 0 else 1.0
    # Optimality score is a combined index: 70% average fit score + 30% cost efficiency index (scaled to 100)
    optimality_score = min(100.0, max(0.0, (avg_fit * 0.7) + (cost_efficiency * 30.0)))

    return selected_candidates, total_cost, optimality_score
