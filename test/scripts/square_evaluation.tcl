set x abc
puts "A simple substitution: $x\n"

set y [set x "def"]
puts "Remember that set returns the new value of the variable:"
puts "    X: $x Y: $y\n"

set z {[set x "String within quotes within braces"]}
puts "Note curly braces: $z\n"

set a "[set x {String within braces within quotes}]"
puts "See how the set is executed: $a"
puts "\$x is: $x\n"

set b "\[set y {This is a string within braces within quotes}]"
# Note the \ escapes the bracket, and must be doubled to be a
# literal character in double quotes
puts "Note the \\ escapes the bracket:\n \$b is: $b"
puts "\$y is: $y"