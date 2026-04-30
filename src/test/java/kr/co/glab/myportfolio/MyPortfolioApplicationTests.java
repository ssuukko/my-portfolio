package kr.co.glab.myportfolio;

import com.portfolio.project.mapper.ProjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude="
                + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                + "org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration"
})
class MyPortfolioApplicationTests {

    @MockBean
    private ProjectMapper projectMapper;

    @Test
    void contextLoads() {
    }

}
