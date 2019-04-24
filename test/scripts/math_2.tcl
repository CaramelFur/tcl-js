set A 3
set B 4
puts "The hypotenuse of a triangle: [expr {hypot($A,$B)}]"

#
# The trigonometric functions work with radians ...
#
set pi6 [expr {3.1415926/6.0}]
puts "Sine and cosine of pi/6: [expr {sin($pi6)}] [expr {cos($pi6)}]"
