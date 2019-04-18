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

set test {wow this is   a string       with    spaces}

puts [lindex $test 5]

set test(0) index1
set test(1) index2

puts "$test(1) $test(0)"
puts "$test"

# Comments work too

set test hi

puts "$test"

set test(a) indexa
set test(b) indexb

puts "$test(b) $test(a)"
puts "$test"
