package com.portfolio.chat.service;

import com.portfolio.project.domain.Project;
import dev.langchain4j.data.segment.TextSegment;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class ProjectChatDocumentConverter {

    public TextSegment toTextSegment(Project project) {
        return TextSegment.from(toText(project));
    }

    public String toText(Project project) {
        return String.join("\n",
                "문서 유형: 포트폴리오 프로젝트 경험",
                line("프로젝트명", project.getTitle()),
                line("프로젝트 요약", project.getSummary()),
                line("프로젝트 설명", project.getDescription()),
                line("사용 기술 스택", project.getTechStack()),
                line("본인 담당 역할", project.getMyRole()),
                line("문제 해결 및 트러블슈팅 경험", project.getTroubleShooting()),
                line("결과 및 성과", project.getResult()),
                line("진행 기간", formatPeriod(project.getStartDate(), project.getEndDate())),
                "답변 가이드: 채용 담당자에게는 프로젝트명, 사용 기술, 본인 역할, 문제 해결 경험, 결과를 중심으로 설명한다."
        );
    }

    public TextSegment toPortfolioSummarySegment(List<Project> projects) {
        return TextSegment.from(toPortfolioSummaryText(projects));
    }

    public String toPortfolioSummaryText(List<Project> projects) {
        return String.join("\n",
                "[포트폴리오 전체 요약]",
                "문서 유형: 포트폴리오 전체 집계 요약",
                line("총 프로젝트 수", projects.size() + "개"),
                line("전체 사용 기술 스택 목록", formatAllTechStacks(projects)),
                line("가장 많이 사용된 기술", formatFrequentTechStacks(projects)),
                line("프로젝트 목록", formatProjectTitles(projects)),
                line("전체 진행 기간", formatTotalPeriod(projects)),
                "답변 가이드: 전체 프로젝트 수, 가장 많이 사용한 기술, 전체 기술 스택, 대표 프로젝트를 묻는 질문에는 이 문서를 우선 근거로 답변한다."
        );
    }

    private String line(String label, String value) {
        return label + ": " + blankToDefault(value);
    }

    private String formatPeriod(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return "정보 없음";
        }

        return String.format("%s ~ %s",
                Objects.toString(startDate, "정보 없음"),
                Objects.toString(endDate, "진행 중")
        );
    }

    private String blankToDefault(String value) {
        if (value == null || value.isBlank()) {
            return "정보 없음";
        }

        return value;
    }

    private String formatAllTechStacks(List<Project> projects) {
        String techStacks = projects.stream()
                .flatMap(project -> splitTechStack(project.getTechStack()).stream())
                .distinct()
                .collect(Collectors.joining(", "));

        return blankToDefault(techStacks);
    }

    private String formatFrequentTechStacks(List<Project> projects) {
        Map<String, Integer> counts = new LinkedHashMap<>();

        projects.stream()
                .flatMap(project -> splitTechStack(project.getTechStack()).stream())
                .forEach(tech -> counts.merge(tech, 1, Integer::sum));

        String frequentTechStacks = counts.entrySet()
                .stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry.comparingByKey()))
                .map(entry -> entry.getKey() + " " + entry.getValue() + "회")
                .collect(Collectors.joining(", "));

        return blankToDefault(frequentTechStacks);
    }

    private List<String> splitTechStack(String techStack) {
        if (techStack == null || techStack.isBlank()) {
            return List.of();
        }

        return List.of(techStack.split("[,;/|\\n]+"))
                .stream()
                .map(String::trim)
                .filter(tech -> !tech.isBlank())
                .toList();
    }

    private String formatProjectTitles(List<Project> projects) {
        String titles = projects.stream()
                .map(Project::getTitle)
                .filter(title -> title != null && !title.isBlank())
                .collect(Collectors.joining(", "));

        return blankToDefault(titles);
    }

    private String formatTotalPeriod(List<Project> projects) {
        LocalDate earliestStartDate = projects.stream()
                .map(Project::getStartDate)
                .filter(Objects::nonNull)
                .min(LocalDate::compareTo)
                .orElse(null);

        boolean hasOngoingProject = projects.stream().anyMatch(project -> project.getEndDate() == null);
        LocalDate latestEndDate = projects.stream()
                .map(Project::getEndDate)
                .filter(Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(null);

        if (earliestStartDate == null && latestEndDate == null && !hasOngoingProject) {
            return "정보 없음";
        }

        return String.format("%s ~ %s",
                Objects.toString(earliestStartDate, "정보 없음"),
                hasOngoingProject ? "진행 중" : Objects.toString(latestEndDate, "정보 없음")
        );
    }
}
