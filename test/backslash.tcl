set Z Albany
set Z_LABEL "The Capitol of New York is: "

puts "$Z_LABEL $Z"   ;# Prints the value of Z
puts "$Z_LABEL \$Z"  ;# Prints literal $Z instead of the value of Z

puts "\nBen Franklin is on the \$100.00 bill"

set a 100.00
puts "Washington is not on the $a bill"    ;# Not what you want
puts "Lincoln is not on the $$a bill"      ;# This is OK
puts "Hamilton is not on the \$a bill"     ;# Not what you want either
puts "Ben Franklin is on the \$$a bill"    ;# But, this is OK

puts "\n................. examples of escape strings"
puts "Tab\tTab\tTab"
puts "This string prints out \non two lines"
puts "This string comes out\
on a single line"
set zero hello
set five 5
set one "hello {this {[expr 3 + [expr 2 + $five] + 4]}} wow [expr 3 + 3]"
puts $one
puts [lindex $one 2 1]
puts triple
set two [lindex $one 2 1 1]
puts $two

puts {$one\nwow}
puts "$one\nwow"

puts "\057\x3a\u0040"
