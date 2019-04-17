set 1 one
set 2 two

puts [list $1 $2]
puts [list {one two}    three]

proc hello {one two} {
    proc subFunc {o t} {
        puts [list $o $t]
    }
    puts [subFunc $two $one]
}

puts "made it here"

hello three four
