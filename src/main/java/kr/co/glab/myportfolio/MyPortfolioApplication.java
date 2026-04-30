package kr.co.glab.myportfolio;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"kr.co.glab.myportfolio", "com.portfolio"})
@MapperScan("com.portfolio.project.mapper")
public class MyPortfolioApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyPortfolioApplication.class, args);
    }

}
