package com.portfolio.project.dto;

import java.util.List;

public record TroubleShootingItem(
        String title,
        String problem,
        String content,
        List<TroubleShootingSolution> solutions,
        Integer selectedSolutionIndex,
        String selectedReason
) {
}
