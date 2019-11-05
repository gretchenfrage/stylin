
interface Shape {}

class Square implements Shape {
    double size;
}

class Circle implements Shape {
    double radius;
}

class Rectangle implements Shape {
    double width;
    double height;
}

public class Main {
    public static double area(Shape shape) {
        return new ClassMatcher<Shape, Double>()
                .withCase(Square.class, square -> square.size * square.size)
                .withCase(Circle.class, circle -> circle.radius * circle.radius * Math.PI)
                .withCase(Rectangle.class, rectangle -> rectangle.width * rectangle.height)
                .match(shape);
    }

    public static void main(String[] args) {
        Square square = new Square();
        square.size = 5;
        System.out.println(area(square));

        Circle circle = new Circle();
        circle.radius = 5;
        System.out.println(area(circle));

        Rectangle rectangle = new Rectangle();
        rectangle.width = 5;
        rectangle.height = 10;
        System.out.println(area(rectangle));
    }
}