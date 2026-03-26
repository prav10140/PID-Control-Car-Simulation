clc;
clear;
close all;

%%  Target Distance
target = 80;   % meters

%%  Time settings
dt = 0.01;
T = 20;
time = 0:dt:T;

%%  Initial Conditions
position = 0;
velocity = 0;

%% Store values
pos_array = zeros(size(time));

%% PID Parameters (CHANGE THESE FOR EXPERIMENTS)
Kp = 2.5;    
Ki = 0.01;    
Kd = 6.5;    

%%  PID Variables
integral = 0;
prev_error = 0;

%% Simulation Loop
for i = 1:length(time)
    
    % Error
    error = target - position;
    
    % PID Terms
    integral = integral + error * dt;
    derivative = (error - prev_error) / dt;
    
    % Control Output (Acceleration)
    u = Kp*error + Ki*integral + Kd*derivative;
    
    % System Update (Car physics)
    velocity = velocity + u * dt;
    position = position + velocity * dt;
    
    % Store
    pos_array(i) = position;
    
    % Update
    prev_error = error;
    pause(0.01);
end

%%  Plot
figure;
plot(time, pos_array, 'b', 'LineWidth', 2); hold on;
yline(target, '--r', 'Target');
grid on;

title('Car Position Control using PID');
xlabel('Time (s)');
ylabel('Position (m)');
legend({'Position', 'Target'});
