#!/usr/bin/env ruby

require "date"
require "shellwords"

POSTS_DIR = "_posts"

def last_modified_date(path)
  date = `git log -1 --format=%cs -- #{Shellwords.escape(path)}`.strip

  if date.empty?
    File.mtime(path).strftime("%Y-%m-%d")
  else
    Date.parse(date).strftime("%Y-%m-%d")
  end
end

def update_front_matter(path, updated_date)
  content = File.read(path)

  unless content.start_with?("---\n")
    warn "Skipping #{path}: no front matter found"
    return
  end

  parts = content.split(/^---\s*$\n/, 3)

  if parts.size < 3
    warn "Skipping #{path}: malformed front matter"
    return
  end

  front_matter = parts[1]
  body = parts[2]

  if front_matter.match?(/^updated:\s*.+$/)
    front_matter = front_matter.gsub(/^updated:\s*.+$/, "updated: #{updated_date}")
  else
    front_matter = front_matter.sub(/\z/, "updated: #{updated_date}\n")
  end

  File.write(path, "---\n#{front_matter}---\n#{body}")
end

Dir.glob("#{POSTS_DIR}/*.{md,markdown}").sort.each do |path|
  updated_date = last_modified_date(path)
  update_front_matter(path, updated_date)
  puts "#{path}: updated #{updated_date}"
end