package com.evoloop.cloud.config;

import com.evoloop.cloud.infrastructure.crypto.Canonical;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.util.List;

@Configuration
@SuppressWarnings("removal")
public class JsonConfiguration implements WebMvcConfigurer {
  @Override public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
    converters.addFirst(new MappingJackson2HttpMessageConverter(Canonical.JSON));
  }
}
