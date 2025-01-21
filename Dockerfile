FROM ruby:3.3.6
RUN apt-get update && apt-get install -y

ENV CHOKIDAR_USEPOLLING 1
EXPOSE 4000

RUN gem install bundler
COPY Gemfile ./
RUN bundle install

RUN mkdir -p /app
WORKDIR /app

CMD "/bin/bash"
