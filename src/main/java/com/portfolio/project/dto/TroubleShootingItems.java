package com.portfolio.project.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

public final class TroubleShootingItems {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<TroubleShootingItem>> ITEM_LIST_TYPE =
            new TypeReference<>() {
            };

    private TroubleShootingItems() {
    }

    public static List<TroubleShootingItem> parse(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        String trimmedValue = value.trim();

        if (trimmedValue.startsWith("[")) {
            try {
                return normalize(OBJECT_MAPPER.readValue(trimmedValue, ITEM_LIST_TYPE));
            } catch (JsonProcessingException ignored) {
                return legacyLines(trimmedValue);
            }
        }

        return legacyLines(trimmedValue);
    }

    public static String serialize(List<TroubleShootingItem> items, String fallbackText) {
        List<TroubleShootingItem> normalizedItems = normalize(items);

        if (!normalizedItems.isEmpty()) {
            try {
                return OBJECT_MAPPER.writeValueAsString(normalizedItems);
            } catch (JsonProcessingException exception) {
                throw new IllegalArgumentException("트러블슈팅 항목을 저장할 수 없습니다.", exception);
            }
        }

        if (fallbackText == null || fallbackText.isBlank()) {
            return null;
        }

        return fallbackText.trim();
    }

    public static String toDisplayText(String value) {
        List<TroubleShootingItem> items = parse(value);

        if (items.isEmpty()) {
            return null;
        }

        return items.stream()
                .map(TroubleShootingItems::formatItem)
                .filter((item) -> !item.isBlank())
                .toList()
                .stream()
                .reduce((current, next) -> current + "\n" + next)
                .orElse(null);
    }

    private static List<TroubleShootingItem> normalize(List<TroubleShootingItem> items) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }

        List<TroubleShootingItem> normalizedItems = new ArrayList<>();

        for (TroubleShootingItem item : items) {
            if (item == null) {
                continue;
            }

            String title = normalizeText(item.title());
            String problem = normalizeText(item.problem());
            String legacyContent = normalizeText(item.content());
            String selectedReason = normalizeText(item.selectedReason());
            List<TroubleShootingSolution> solutions = normalizeSolutions(item.solutions());
            Integer selectedSolutionIndex = normalizeSelectedSolutionIndex(
                    item.selectedSolutionIndex(),
                    solutions.size()
            );

            if (problem == null) {
                problem = legacyContent;
            }

            if (title == null && problem == null && solutions.isEmpty() && selectedReason == null) {
                continue;
            }

            normalizedItems.add(new TroubleShootingItem(
                    title,
                    problem,
                    null,
                    solutions,
                    selectedSolutionIndex,
                    selectedReason
            ));
        }

        return List.copyOf(normalizedItems);
    }

    private static List<TroubleShootingItem> legacyLines(String value) {
        return value.lines()
                .map(String::trim)
                .filter((line) -> !line.isBlank())
                .map((line) -> new TroubleShootingItem(null, line, null, List.of(), null, null))
                .toList();
    }

    private static String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isBlank() ? null : trimmedValue;
    }

    private static String formatItem(TroubleShootingItem item) {
        List<String> lines = new ArrayList<>();

        if (item.title() != null) {
            lines.add(item.title());
        }

        if (item.problem() != null) {
            lines.add("문제: " + item.problem());
        }

        List<TroubleShootingSolution> solutions = item.solutions() == null ? List.of() : item.solutions();

        for (int index = 0; index < solutions.size(); index += 1) {
            TroubleShootingSolution solution = solutions.get(index);
            String title = solution.title() == null ? "방안 " + (index + 1) : solution.title();
            String content = solution.content() == null ? "" : " - " + solution.content();
            lines.add(title + content);

            if (solution.pros() != null) {
                lines.add("장점: " + solution.pros());
            }

            if (solution.cons() != null) {
                lines.add("단점: " + solution.cons());
            }
        }

        if (item.selectedSolutionIndex() != null && item.selectedSolutionIndex() < solutions.size()) {
            TroubleShootingSolution selectedSolution = solutions.get(item.selectedSolutionIndex());
            lines.add("선택한 방안: " + (
                    selectedSolution.title() == null
                            ? "방안 " + (item.selectedSolutionIndex() + 1)
                            : selectedSolution.title()
            ));
        }

        if (item.selectedReason() != null) {
            lines.add("선택 이유: " + item.selectedReason());
        }

        return String.join("\n", lines);
    }

    private static List<TroubleShootingSolution> normalizeSolutions(List<TroubleShootingSolution> solutions) {
        if (solutions == null || solutions.isEmpty()) {
            return List.of();
        }

        List<TroubleShootingSolution> normalizedSolutions = new ArrayList<>();

        for (TroubleShootingSolution solution : solutions) {
            if (solution == null) {
                continue;
            }

            String title = normalizeText(solution.title());
            String content = normalizeText(solution.content());
            String pros = normalizeText(solution.pros());
            String cons = normalizeText(solution.cons());

            if (title == null && content == null && pros == null && cons == null) {
                continue;
            }

            normalizedSolutions.add(new TroubleShootingSolution(title, content, pros, cons));
        }

        return List.copyOf(normalizedSolutions);
    }

    private static Integer normalizeSelectedSolutionIndex(Integer selectedSolutionIndex, int solutionCount) {
        if (solutionCount == 0) {
            return null;
        }

        if (selectedSolutionIndex == null || selectedSolutionIndex < 0 || selectedSolutionIndex >= solutionCount) {
            return 0;
        }

        return selectedSolutionIndex;
    }
}
